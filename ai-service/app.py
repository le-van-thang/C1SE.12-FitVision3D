#!/usr/bin/env python3
# ==============================================================================
# app.py: Dịch vụ REST API trích xuất số đo may mặc 3D (ISO 8559) bằng FastAPI
# Tự động nạp trước mô hình vào bộ nhớ để suy luận tức thì (< 1.5s/ảnh)
# ==============================================================================

import os
import sys
import time
import base64
import numpy as np
import cv2
import torch

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from pathlib import Path
import json

# Nạp các đường dẫn module nội bộ
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CURRENT_DIR)
sys.path.insert(0, os.path.join(CURRENT_DIR, 'main'))
sys.path.insert(0, os.path.join(CURRENT_DIR, 'data'))
sys.path.insert(0, os.path.join(CURRENT_DIR, 'common'))

from run_measurement import load_detector, load_smpler_x_model, detect_person, extract_3d_mesh, compute_measurements

app = FastAPI(
    title="AI-Tailor REST API",
    description="Hệ thống AI trích xuất số đo cơ thể 3D cho may mặc và tư vấn chọn size quần áo tự động theo tiêu chuẩn ISO 8559.",
    version="1.0.0"
)

# Kích hoạt CORS để cho phép các ứng dụng Web/Mobile (React, Flutter, Vue) gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Biến toàn cục lưu trữ mô hình nạp sẵn
MODELS = {
    "device": "cuda:0" if torch.cuda.is_available() else "cpu",
    "detector": None,
    "demoer": None
}


# Nạp module tính toán kích cỡ may mặc đa hệ (Châu Á, US, EU, UK) chuẩn ISO 8559
from garment_sizing import recommend_garment_sizes, normalize_inseam, SIZE_CHARTS


@app.on_event("startup")
def startup_event():
    """Tự động khởi động và giữ sẵn mô hình trong bộ nhớ đệm (VRAM/RAM)."""
    device = MODELS["device"]
    print(f"[*] Khởi động AI-Tailor Server trên thiết bị: {device}...")
    try:
        MODELS["detector"] = load_detector(device)
        MODELS["demoer"] = load_smpler_x_model("smpler_x_s32", device)
        print("[✓] AI-Tailor Model Cache đã sẵn sàng tiếp nhận yêu cầu.")
    except Exception as e:
        print(f"[!] Cảnh báo nạp mô hình lúc khởi động: {e}")


@app.get("/")
def root():
    return {
        "system": "AI-Tailor 3D Measurement Extraction API",
        "status": "online",
        "device": MODELS["device"],
        "docs_url": "/docs",
        "iso_standard": "ISO 8559-1 (Clothing Anthropometry)"
    }


@app.post("/api/v1/segment-person")
async def segment_person(
    file: UploadFile = File(..., description="Ảnh toàn thân cần tách nền"),
    threshold: float = Form(0.45, description="Ngưỡng tách nền MediaPipe (0.2 - 0.85)")
):
    """
    Tách nền người dùng chính xác bằng Google MediaPipe SelfieSegmentation,
    tự động cắt gọn khung nhân vật để đưa vào Phòng Thử Đồ 3D đúng tỷ lệ.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Không thể giải mã ảnh.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file: {str(e)}")

    import mediapipe as mp

    h, w = img.shape[:2]
    max_dim = 960
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = img.shape[:2]

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    thresh = float(np.clip(threshold, 0.15, 0.85))
    with mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0) as seg:
        res = seg.process(rgb)
        raw_mask = res.segmentation_mask

    binary_mask = (raw_mask > thresh).astype(np.float32)
    alpha = cv2.GaussianBlur(binary_mask, (5, 5), 0)
    alpha_u8 = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)

    ys, xs = np.where(alpha_u8 > 50)
    if len(xs) < 100 or len(ys) < 100:
        raise HTTPException(status_code=422, detail="Không nhận diện rõ người trong ảnh.")

    pad_x = max(8, int((xs.max() - xs.min()) * 0.05))
    pad_y = max(8, int((ys.max() - ys.min()) * 0.03))
    x0 = max(0, int(xs.min()) - pad_x)
    y0 = max(0, int(ys.min()) - pad_y)
    x1 = min(w, int(xs.max()) + pad_x)
    y1 = min(h, int(ys.max()) + pad_y)

    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha_u8
    cropped = rgba[y0:y1, x0:x1]

    ok, buf = cv2.imencode(".png", cropped)
    if not ok:
        raise HTTPException(status_code=500, detail="Lỗi mã hóa PNG sau khi tách nền.")

    b64 = base64.b64encode(buf.tobytes()).decode("ascii")
    return {
        "status": "success",
        "cutout_data_url": f"data:image/png;base64,{b64}",
        "foreground_ratio": float(len(xs)) / float(w * h),
        "width": int(x1 - x0),
        "height": int(y1 - y0),
    }


@app.post("/api/v1/measure")
async def extract_measurements(
    file: UploadFile = File(..., description="File ảnh toàn thân chụp dáng chữ A"),
    height_cm: Optional[float] = Form(None, description="Chiều cao thực tế (cm) để đạt độ chính xác 100%"),
    weight_kg: Optional[float] = Form(None, description="Cân nặng thực tế (kg) để tinh chỉnh độ dày cơ thể"),
    gender: Optional[str] = Form("neutral", description="Giới tính giải phẫu: neutral, male, hoặc female")
):
    """
    Endpoint tiếp nhận ảnh và trích xuất bảng số đo may mặc 13 thông số ISO 8559-1.
    """
    if MODELS["demoer"] is None:
        startup_event()

    start_time = time.time()

    # Đọc dữ liệu ảnh từ buffer bộ nhớ
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Không thể giải mã file ảnh gửi lên.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file: {str(e)}")

    device = MODELS["device"]
    demoer = MODELS["demoer"]
    detector = MODELS["detector"]

    # 1. Phát hiện người trong ảnh
    box_xywh = detect_person(detector, img)

    # 2. Cắt ảnh và hồi quy vector 3D betas
    betas, _ = extract_3d_mesh(demoer, img, box_xywh, device)

    # 3. Tính toán toàn bộ 13 số đo may mặc ISO 8559-1
    results = compute_measurements(
        betas=betas,
        height_cm_input=height_cm,
        weight_kg_input=weight_kg,
        gender=gender or "neutral",
        device=device
    )

    elapsed_sec = round(time.time() - start_time, 2)
    garment_sizes = recommend_garment_sizes(results, gender=gender)

    return {
        "status": "success",
        "subject_metadata": {
            "gender": gender,
            "input_height_cm": height_cm,
            "input_weight_kg": weight_kg
        },
        "iso_8559_measurements": results,
        "garment_size_recommendations": garment_sizes,
        "execution_time_seconds": elapsed_sec
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

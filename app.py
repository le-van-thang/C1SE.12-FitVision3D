#!/usr/bin/env python3
# ==============================================================================
# app.py: Dịch vụ REST API trích xuất số đo may mặc 3D (ISO 8559) bằng FastAPI
# Tự động nạp trước mô hình vào bộ nhớ để suy luận tức thì (< 1.5s/ảnh)
# ==============================================================================

import os
import sys
import time
import numpy as np
import cv2
import torch

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

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

STATIC_DIR = os.path.join(CURRENT_DIR, "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

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


def recommend_garment_sizes(results_dict: Dict[str, Any], gender: str = "neutral") -> Dict[str, Any]:
    """Hàm tính toán và gợi ý kích cỡ trang phục theo bảng size quốc tế và Việt Nam."""
    meas = results_dict.get("so_do_may_mac_cm", results_dict)
    chest = meas.get("vong_nguc", meas.get("vong_nguc_cm", 95.0))
    waist = meas.get("vong_eo", meas.get("vong_eo_cm", 80.0))
    inseam = meas.get("dai_chan_inseam", meas.get("dai_chan_inseam_cm", 72.0))

    # 1. Size áo sơ mi / áo thun (Topwear)
    if chest < 88.0:
        top_size = "XS"
    elif chest <= 92.5:
        top_size = "S"
    elif chest <= 97.5:
        top_size = "M"
    elif chest <= 103.0:
        top_size = "L"
    elif chest <= 109.0:
        top_size = "XL"
    else:
        top_size = "XXL"

    # 2. Size quần âu / quần jean (Bottomwear theo Inch)
    waist_inch = int(round(waist / 2.54))
    inseam_inch = int(round(inseam / 2.54))
    trouser_tag = f"Size {waist_inch} ({waist_inch}W x {inseam_inch}L)"

    # 3. Phân loại form dáng cơ thể (Body Fit Classification)
    ratio = chest / (waist if waist > 0 else 1)
    if ratio > 1.20:
        fit_type = "V-Shape / Athletic (Thể thao, ngực nở eo thon)"
    elif ratio >= 1.05:
        fit_type = "Regular / Balanced (Cân đối tiêu chuẩn)"
    else:
        fit_type = "Comfort / Relaxed Fit (Bụng đầy đặn)"

    return {
        "topwear_shirt_size": top_size,
        "bottomwear_trouser_size": trouser_tag,
        "waist_inches": waist_inch,
        "inseam_inches": inseam_inch,
        "body_shape_classification": fit_type,
        "ease_allowance_recommendation": {
            "slim_fit_chest_cm": round(chest + 5.0, 1),
            "regular_fit_chest_cm": round(chest + 8.0, 1),
            "trouser_waist_ease_cm": round(waist + 2.0, 1)
        }
    }


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


@app.get("/", response_class=HTMLResponse)
def root_web():
    """Giao diện Web trực quan để tải ảnh và xem số đo 3D tức thì."""
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h2>AI-Tailor REST API đang hoạt động!</h2><p>Xem Swagger UI tại: <a href='/docs'>/docs</a></p>")


@app.get("/api/v1/info")
def root_info():
    """Thông tin trạng thái dịch vụ và tài liệu."""
    return {
        "system": "AI-Tailor 3D Measurement Extraction API",
        "status": "online",
        "device": MODELS["device"],
        "docs_url": "/docs",
        "iso_standard": "ISO 8559-1 (Clothing Anthropometry)"
    }


@app.get("/api/v1/demo-image")
def get_demo_image():
    """Cung cấp file ảnh mẫu A-pose (demo_sample.jpg) để người dùng thử nghiệm nhanh."""
    demo_path = os.path.join(CURRENT_DIR, "demo_sample.jpg")
    if os.path.exists(demo_path):
        return FileResponse(demo_path, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Ảnh mẫu demo_sample.jpg không tồn tại trên server.")


@app.post("/api/v1/measure")
async def extract_measurements(
    file: UploadFile = File(..., description="File ảnh toàn thân chụp dáng chữ A"),
    height_cm: Optional[float] = Form(None, description="Chiều cao thực tế (cm) để đạt độ chính xác 100%"),
    weight_kg: Optional[float] = Form(None, description="Cân nặng thực tế (kg) để tinh chỉnh độ dày cơ thể"),
    gender: Optional[str] = Form("neutral", description="Giới tính giải phẫu: neutral, male, hoặc female")
):
    """
    Endpoint tiếp nhận ảnh và trích xuất bảng số đo may mặc 8 thông số ISO 8559.
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

    # Tạo thư mục lưu trữ avatar 3D
    avatars_dir = os.path.join(CURRENT_DIR, "output", "avatars")
    os.makedirs(avatars_dir, exist_ok=True)
    avatar_filename = f"avatar_{int(time.time() * 1000)}.obj"
    avatar_filepath = os.path.join(avatars_dir, avatar_filename)

    # 3. Tính toán toàn bộ 8 số đo may mặc ISO 8559 và xuất lưới 3D (.obj)
    results = compute_measurements(
        betas=betas,
        height_cm_input=height_cm,
        weight_kg_input=weight_kg,
        gender=gender or "neutral",
        device=device,
        save_mesh_path=avatar_filepath
    )

    elapsed_sec = round(time.time() - start_time, 2)
    garment_sizes = recommend_garment_sizes(results, gender=gender)

    has_mesh = os.path.exists(avatar_filepath)
    avatar_info = {
        "available": has_mesh,
        "filename": avatar_filename if has_mesh else None,
        "mesh_url": f"/api/v1/avatar/{avatar_filename}" if has_mesh else None,
        "download_url": f"/api/v1/avatar/{avatar_filename}?download=true" if has_mesh else None,
        "format": "Wavefront OBJ (.obj)",
        "standard": "SMPL-X 3D Mesh (10,475 Vertices / 20,908 Faces)"
    }

    return {
        "status": "success",
        "subject_metadata": {
            "gender": gender,
            "input_height_cm": height_cm,
            "input_weight_kg": weight_kg
        },
        "iso_8559_measurements": results,
        "garment_size_recommendations": garment_sizes,
        "avatar_3d": avatar_info,
        "execution_time_seconds": elapsed_sec
    }


@app.get("/api/v1/avatar/{filename}")
def get_avatar_file(filename: str, download: bool = False):
    """Cung cấp file 3D avatar (.obj) để Three.js render hoặc người dùng tải về máy."""
    safe_name = os.path.basename(filename)
    if safe_name in ["sample", "demo", "avatar_sample.obj", "sample.obj"]:
        file_path = os.path.join(CURRENT_DIR, "avatar_sample.obj")
        safe_name = "avatar_sample.obj"
    else:
        file_path = os.path.join(CURRENT_DIR, "output", "avatars", safe_name)

    if not os.path.exists(file_path):
        # Fallback về avatar_sample.obj nếu file không tồn tại
        fallback = os.path.join(CURRENT_DIR, "avatar_sample.obj")
        if os.path.exists(fallback):
            file_path = fallback
            safe_name = "avatar_sample.obj"
        else:
            raise HTTPException(status_code=404, detail="File 3D avatar không tồn tại trên server.")

    headers = {}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{safe_name}"'
        return FileResponse(file_path, media_type="application/octet-stream", headers=headers)
    return FileResponse(file_path, media_type="model/obj", headers=headers)


@app.get("/api/v1/avatar-sample")
def get_avatar_sample(download: bool = False):
    """Cung cấp file 3D avatar mẫu (avatar_sample.obj) để trải nghiệm nhanh 3D Viewer."""
    sample_path = os.path.join(CURRENT_DIR, "avatar_sample.obj")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy file avatar_sample.obj")
    headers = {}
    if download:
        headers["Content-Disposition"] = 'attachment; filename="avatar_sample.obj"'
        return FileResponse(sample_path, media_type="application/octet-stream", headers=headers)
    return FileResponse(sample_path, media_type="model/obj", headers=headers)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

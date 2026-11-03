#!/usr/bin/env python3
# ==============================================================================
# download_models.py: Script kiểm tra và hỗ trợ tải trọng số mô hình cho AI-Tailor
# Tải các checkpoints: SMPLer-X, ViTPose, và mô hình nhân trắc học SMPL-X (10.475 đỉnh)
# ==============================================================================

import os
import sys
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODELS_INFO = [
    {
        "name": "Mô hình SMPLer-X S32 Backbone (384MB)",
        "path": os.path.join(BASE_DIR, "pretrained_models", "smpler_x_s32.pth.tar"),
        "url": "https://huggingface.co/caizhongang/SMPLer-X/resolve/main/smpler_x_s32.pth.tar",
        "description": "Trọng số chính của mạng SMPLer-X hồi quy khung xương và hình thể 3D"
    },
    {
        "name": "Mô hình ViTPose Small Encoder (97MB)",
        "path": os.path.join(BASE_DIR, "pretrained_models", "vitpose_small.pth"),
        "url": "https://huggingface.co/camenduru/SMPLer-X/resolve/main/vitpose_small.pth",
        "description": "Mạng Transformer Encoder trích xuất đặc trưng tư thế người"
    },
    {
        "name": "Mô hình SMPL-X Neutral (108MB)",
        "path": os.path.join(BASE_DIR, "common", "utils", "human_model_files", "smplx", "SMPLX_NEUTRAL.npz"),
        "url": "https://huggingface.co/camenduru/SMPLer-X/resolve/main/SMPLX_NEUTRAL.npz",
        "description": "Lưới 3D nhân trắc học trung tính (10.475 đỉnh)"
    },
    {
        "name": "Mô hình SMPL-X Male (108MB)",
        "path": os.path.join(BASE_DIR, "common", "utils", "human_model_files", "smplx", "SMPLX_MALE.npz"),
        "url": "https://huggingface.co/camenduru/SMPLer-X/resolve/main/SMPLX_MALE.npz",
        "description": "Lưới 3D nhân trắc học nam giới"
    },
    {
        "name": "Mô hình SMPL-X Female (108MB)",
        "path": os.path.join(BASE_DIR, "common", "utils", "human_model_files", "smplx", "SMPLX_FEMALE.npz"),
        "url": "https://huggingface.co/camenduru/SMPLer-X/resolve/main/SMPLX_FEMALE.npz",
        "description": "Lưới 3D nhân trắc học nữ giới"
    }
]


def download_file_with_progress(url: str, output_path: str):
    """Tải file từ URL với thanh tiến trình trực quan."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    tmp_path = output_path + ".tmp"
    
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as response, open(tmp_path, "wb") as out_file:
        total_size = int(response.info().get("Content-Length", 0))
        block_size = 1024 * 1024  # 1MB
        downloaded = 0
        
        while True:
            buffer = response.read(block_size)
            if not buffer:
                break
            downloaded += len(buffer)
            out_file.write(buffer)
            if total_size > 0:
                pct = downloaded * 100 / total_size
                mb_done = downloaded / (1024 * 1024)
                mb_total = total_size / (1024 * 1024)
                sys.stdout.write(f"\r    [↓] Đang tải: {mb_done:.1f}/{mb_total:.1f} MB ({pct:.1f}%)")
                sys.stdout.flush()
    print()
    if os.path.exists(output_path):
        os.remove(output_path)
    os.rename(tmp_path, output_path)


def check_and_report_models(auto_download=False):
    print("=" * 75)
    print("   KIỂM TRA TÌNH TRẠNG TRỌNG SỐ MÔ HÌNH AI-TAILOR (CHECKPOINTS AUDIT)")
    print("=" * 75)

    all_exist = True
    missing_models = []

    for item in MODELS_INFO:
        exists = os.path.exists(item["path"]) and os.path.getsize(item["path"]) > 1000
        size_mb = (os.path.getsize(item["path"]) / (1024 * 1024)) if exists else 0
        status_icon = "[✓]" if exists else "[✗]"
        print(f" {status_icon} {item['name']:<45} : {'SẴN SÀNG (' + f'{size_mb:.1f} MB)' if exists else 'THIẾU'}")
        if not exists:
            all_exist = False
            missing_models.append(item)

    print("=" * 75)
    if all_exist:
        print("[✓] CHÚC MỪNG: Toàn bộ 5 mô hình cốt lõi đã sẵn sàng! Bạn có thể chạy ngay.")
        return True

    print(f"[!] Phát hiện {len(missing_models)} mô hình chưa có trên máy trạm này.")
    if auto_download:
        print("[*] Đang tự động tải các mô hình còn thiếu từ máy chủ lưu trữ...")
        for item in missing_models:
            print(f"[*] Đang tải: {item['name']}...")
            try:
                download_file_with_progress(item["url"], item["path"])
                print(f"[✓] Đã tải xong: {item['name']}")
            except Exception as e:
                print(f"[!] Lỗi khi tải {item['name']}: {e}")
        return check_and_report_models(auto_download=False)
    else:
        print("    Bạn có thể chạy lệnh: python download_models.py --download")
        print("    để tự động tải toàn bộ các file còn thiếu.")
        print("=" * 75)
        return False


if __name__ == "__main__":
    should_download = "--download" in sys.argv or "-d" in sys.argv
    check_and_report_models(auto_download=should_download)

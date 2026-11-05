#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
garment_sizing.py: Module tính toán và gợi ý kích cỡ trang phục đa hệ (Châu Á, US, EU, UK)
theo tiêu chuẩn ISO 8559-1. Độc lập hoàn toàn với PyTorch/GPU.
"""

from typing import Dict, Any, Optional
from pathlib import Path
import json

# Nạp cấu hình bảng size dùng chung
SIZE_CHARTS = {}
_chart_path = Path(__file__).resolve().parent.parent / "shared" / "size-charts.json"
if not _chart_path.exists():
    _chart_path = Path("shared/size-charts.json")

if _chart_path.exists():
    try:
        with open(_chart_path, "r", encoding="utf-8") as _f:
            SIZE_CHARTS = json.load(_f)
    except Exception as _e:
        print(f"[!] Cảnh báo nạp size-charts.json: {_e}")


def normalize_inseam(raw_inches: int) -> int:
    """Chuẩn hóa chiều dài quần (inseam) về các nấc chuẩn quốc tế [28, 30, 32, 34, 36]."""
    standards = SIZE_CHARTS.get("standard_inseams", [28, 30, 32, 34, 36])
    return min(standards, key=lambda s: abs(raw_inches - s))


def recommend_garment_sizes(
    results_dict: Dict[str, Any],
    gender: str = "neutral",
    active_system: str = "asia",
    preferred_fit: str = "regular"
) -> Dict[str, Any]:
    """
    Hàm tính toán và gợi ý kích cỡ trang phục đa hệ (Châu Á, US, EU, UK)
    theo chuẩn ISO 8559 và đồng bộ hoàn toàn với TypeScript logic.
    """
    meas = results_dict.get("so_do_may_mac_cm", results_dict)
    chest = float(meas.get("vong_nguc", meas.get("vong_nguc_cm", 95.0)))
    waist = float(meas.get("vong_eo", meas.get("vong_eo_cm", 80.0)))
    inseam = float(meas.get("dai_chan_inseam", meas.get("dai_chan_inseam_cm", 72.0)))
    shoulder = float(meas.get("rong_vai", meas.get("rong_vai_cm", 0.0)))
    hips = float(meas.get("vong_mong", meas.get("vong_mong_cm", 0.0)))

    is_female = (gender == "female")
    table = SIZE_CHARTS.get("women", {}) if is_female else SIZE_CHARTS.get("men", {})
    top_rows = table.get("topwear", [])
    bottom_rows = table.get("bottomwear", [])

    # Dự phòng nếu file size-charts.json chưa có trong môi trường
    if not top_rows:
        top_rows = [
            {"asia": "XS", "us": "XS", "eu": "44", "uk": "32-34", "chest_min": 78.0, "chest_max": 84.0},
            {"asia": "S", "us": "XS", "eu": "46", "uk": "35-37", "chest_min": 84.0, "chest_max": 90.0},
            {"asia": "M", "us": "S", "eu": "48", "uk": "38-40", "chest_min": 90.0, "chest_max": 96.0},
            {"asia": "L", "us": "M", "eu": "50", "uk": "41-43", "chest_min": 96.0, "chest_max": 102.0},
            {"asia": "XL", "us": "L", "eu": "52", "uk": "44-46", "chest_min": 102.0, "chest_max": 108.0},
            {"asia": "XXL", "us": "XL", "eu": "54", "uk": "47-49", "chest_min": 108.0, "chest_max": 114.0},
        ]
    if not bottom_rows:
        bottom_rows = [
            {"asia": "XS", "us": "26-27", "waist_min": 66.0, "waist_max": 70.0},
            {"asia": "S", "us": "28-29", "waist_min": 71.0, "waist_max": 74.0},
            {"asia": "M", "us": "30-31", "waist_min": 76.0, "waist_max": 79.0},
            {"asia": "L", "us": "32-33", "waist_min": 81.0, "waist_max": 84.0},
            {"asia": "XL", "us": "34-35", "waist_min": 86.0, "waist_max": 89.0},
            {"asia": "XXL", "us": "36-38", "waist_min": 91.0, "waist_max": 97.0},
        ]

    # 1. TÍNH SIZE ÁO (TOPWEAR)
    primary_idx = 0
    if chest < top_rows[0]["chest_min"]:
        primary_idx = 0
    elif chest >= top_rows[-1]["chest_max"]:
        primary_idx = len(top_rows) - 1
    else:
        for i, row in enumerate(top_rows):
            if row["chest_min"] <= chest <= row["chest_max"]:
                primary_idx = i
                break
            if i < len(top_rows) - 1 and row["chest_max"] < chest < top_rows[i + 1]["chest_min"]:
                diff_low = chest - row["chest_max"]
                diff_high = top_rows[i + 1]["chest_min"] - chest
                primary_idx = i if diff_low <= diff_high else i + 1
                break

    # Ranh giới giữa 2 size (<= 1cm)
    is_boundary = False
    lower_row = top_rows[primary_idx]
    upper_row = top_rows[primary_idx]
    for i in range(len(top_rows) - 1):
        if abs(chest - top_rows[i]["chest_max"]) <= 1.0:
            is_boundary = True
            lower_row = top_rows[i]
            upper_row = top_rows[i + 1]
            break

    # Kiểm tra chỉ số vai
    upgraded_idx = primary_idx
    notes_reason = None
    if shoulder > 0 and not is_female:
        shoulder_idx = primary_idx
        for i, row in enumerate(top_rows):
            if "shoulder_min" in row and "shoulder_max" in row:
                if row["shoulder_min"] <= shoulder <= row["shoulder_max"]:
                    shoulder_idx = i
                    break
        if shoulder_idx > primary_idx:
            upgraded_idx = shoulder_idx
            notes_reason = f"Khuyên tăng lên cỡ {top_rows[upgraded_idx]['asia']} do vai rộng ({shoulder}cm)"

    # Form mặc
    final_idx = upgraded_idx
    if preferred_fit == "relaxed":
        final_idx = min(len(top_rows) - 1, final_idx + 1)
    elif preferred_fit == "slim" and is_boundary:
        final_idx = min(primary_idx, top_rows.index(lower_row))

    selected_top = top_rows[final_idx]
    asia_top = selected_top["asia"]
    us_top = selected_top["us"]
    eu_top = selected_top["eu"]
    uk_top = selected_top["uk"]

    boundary_text = None
    if is_boundary and preferred_fit == "regular":
        boundary_text = f"{lower_row['asia']} (vừa ôm) hoặc {upper_row['asia']} (thoải mái)"

    top_recommended = asia_top
    if is_boundary and preferred_fit == "regular":
        top_recommended = f"{lower_row['asia']} hoặc {upper_row['asia']}"

    if active_system == "us":
        top_recommended = f"{lower_row['us']} hoặc {upper_row['us']}" if (is_boundary and preferred_fit == "regular") else us_top
    elif active_system == "eu":
        top_recommended = f"{lower_row['eu']} hoặc {upper_row['eu']}" if (is_boundary and preferred_fit == "regular") else eu_top
    elif active_system == "uk":
        top_recommended = f"{lower_row['uk']} hoặc {upper_row['uk']}" if (is_boundary and preferred_fit == "regular") else uk_top

    sub_parts = []
    if active_system != "asia": sub_parts.append(f"Châu Á: {asia_top}")
    if active_system != "us": sub_parts.append(f"US: {us_top}")
    if active_system != "eu": sub_parts.append(f"EU: {eu_top}")
    if active_system != "uk": sub_parts.append(f"UK: {uk_top}")
    top_sub_label = " | ".join(sub_parts)

    if not notes_reason:
        notes_reason = f"Dựa trên ngực {chest}cm, vai {shoulder}cm" if shoulder > 0 else f"Dựa trên ngực {chest}cm"

    # 2. TÍNH SIZE QUẦN (BOTTOMWEAR)
    waist_inch = int(round(waist / 2.54))
    raw_inseam = int(round(inseam / 2.54)) if inseam > 0 else 30
    normalized_inseam = normalize_inseam(raw_inseam)

    bottom_idx = 0
    if waist < bottom_rows[0]["waist_min"]:
        bottom_idx = 0
    elif waist >= bottom_rows[-1]["waist_max"]:
        bottom_idx = len(bottom_rows) - 1
    else:
        for i, row in enumerate(bottom_rows):
            if row["waist_min"] <= waist <= row["waist_max"]:
                bottom_idx = i
                break
            if i < len(bottom_rows) - 1 and row["waist_max"] < waist < bottom_rows[i + 1]["waist_min"]:
                bottom_idx = i
                break

    selected_bottom = bottom_rows[bottom_idx]
    asia_bottom = selected_bottom["asia"]
    us_bottom = f"{waist_inch}W x {normalized_inseam}L"

    hip_notes = None
    if hips > 0:
        diff = hips - waist
        threshold = 28.0 if is_female else 20.0
        if diff > threshold:
            hip_notes = "Mông khá đầy, nên chọn thêm 1 cỡ hoặc form regular/relaxed."

    trouser_tag = f"Cỡ {waist_inch} ({waist_inch}W x {normalized_inseam}L) ≈ Size {asia_bottom}"
    trouser_sub = f"US/UK: {waist_inch}W x {normalized_inseam}L"

    # 3. PHÂN LOẠI FORM DÁNG
    ratio = chest / (waist if waist > 0 else 1)
    if ratio > 1.20:
        fit_type = "V-Shape / Athletic (Thể thao, ngực nở eo thon)"
    elif ratio >= 1.05:
        fit_type = "Regular / Balanced (Cân đối tiêu chuẩn)"
    else:
        fit_type = "Comfort / Relaxed Fit (Bụng đầy đặn)"

    ease = SIZE_CHARTS.get("ease_allowances", {})

    return {
        "topwear": {
            "asia": asia_top,
            "us": us_top,
            "eu": eu_top,
            "uk": uk_top,
            "recommended_label": top_recommended,
            "sub_label": top_sub_label,
            "is_boundary": is_boundary,
            "boundary_text": boundary_text,
            "notes": notes_reason
        },
        "bottomwear": {
            "asia": asia_bottom,
            "us": us_bottom,
            "eu": str(selected_bottom.get("waist_inch_min", waist_inch)),
            "uk": us_bottom,
            "waist_inches": waist_inch,
            "inseam_inches": normalized_inseam,
            "tag": trouser_tag,
            "sub_label": trouser_sub,
            "notes": hip_notes
        },
        "body_shape_classification": fit_type,
        "ease_allowance_recommendation": {
            "slim_fit_chest_cm": round(chest + ease.get("slim_fit_chest_cm", 5.0), 1),
            "regular_fit_chest_cm": round(chest + ease.get("regular_fit_chest_cm", 8.0), 1),
            "trouser_waist_ease_cm": round(waist + ease.get("trouser_waist_ease_cm", 2.0), 1)
        },
        # Tương thích ngược
        "topwear_shirt_size": top_recommended,
        "bottomwear_trouser_size": trouser_tag,
        "waist_inches": waist_inch,
        "inseam_inches": normalized_inseam
    }


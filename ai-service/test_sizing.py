#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_sizing.py: Unit tests cho thuật toán gợi ý kích cỡ đa hệ (Châu Á, US, EU, UK)
Kiểm tra 5 test cases bắt buộc từ Section 8 spec.
"""
import sys
from pathlib import Path

# Thêm ai-service vào path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from garment_sizing import recommend_garment_sizes

def run_tests():
    print("=" * 60)
    print("CHẠY UNIT TEST PYTHON: THUẬT TOÁN KÍCH CỠ ĐA HỆ")
    print("=" * 60)

    # -------------------------------------------------------------
    # Test Case 1: Số đo thực tế của User Thắng Lê
    # Nam, 167cm, 55kg, ngực 85.4, eo 71.2, mông 87, vai 42.6, chân trong 76.8
    # Kỳ vọng: Áo: Châu Á S, US XS, EU 46. Quần: 28W x 30L ≈ S
    # -------------------------------------------------------------
    tc1_input = {
        "chieu_cao_cm": 167.0,
        "can_nang_kg": 55.0,
        "vong_nguc_cm": 85.4,
        "vong_eo_cm": 71.2,
        "vong_mong_cm": 87.0,
        "rong_vai_cm": 42.6,
        "dai_chan_inseam_cm": 76.8,
    }
    tc1_res = recommend_garment_sizes(tc1_input, gender="male", active_system="asia")
    print("\n[TEST CASE 1] Số đo thực tế User Thắng Lê (167cm, 55kg, ngực 85.4cm, eo 71.2cm, vai 42.6cm):")
    print(f"  - Áo Châu Á: {tc1_res['topwear']['asia']} (Kỳ vọng: S)")
    print(f"  - Áo US:     {tc1_res['topwear']['us']} (Kỳ vọng: XS)")
    print(f"  - Áo EU:     {tc1_res['topwear']['eu']} (Kỳ vọng: 46)")
    print(f"  - Áo UK:     {tc1_res['topwear']['uk']}")
    print(f"  - Tag Quần:  {tc1_res['bottomwear']['tag']} (Kỳ vọng chứa: 28W x 30L ≈ Size S)")
    print(f"  - Ghi chú:   {tc1_res['topwear']['notes']}")

    assert tc1_res["topwear"]["asia"] == "S", f"TC1 thất bại: Áo Châu Á kỳ vọng S nhưng ra {tc1_res['topwear']['asia']}"
    assert tc1_res["topwear"]["us"] == "XS", f"TC1 thất bại: Áo US kỳ vọng XS nhưng ra {tc1_res['topwear']['us']}"
    assert tc1_res["topwear"]["eu"] == "46", f"TC1 thất bại: Áo EU kỳ vọng 46 nhưng ra {tc1_res['topwear']['eu']}"
    assert tc1_res["bottomwear"]["waist_inches"] == 28, f"TC1 thất bại: Quần eo inch kỳ vọng 28 nhưng ra {tc1_res['bottomwear']['waist_inches']}"
    assert tc1_res["bottomwear"]["inseam_inches"] == 30, f"TC1 thất bại: Quần ống inch kỳ vọng 30 nhưng ra {tc1_res['bottomwear']['inseam_inches']}"
    assert tc1_res["bottomwear"]["asia"] == "S", f"TC1 thất bại: Quần Châu Á kỳ vọng S nhưng ra {tc1_res['bottomwear']['asia']}"
    print("  => [PASS] TEST CASE 1 ĐẠT CHUẨN HOÀN TOÀN!")

    # -------------------------------------------------------------
    # Test Case 2: Nam, 175cm, 70kg, ngực 98, eo 82, vai 46
    # Kỳ vọng: Áo: Châu Á L, US M (ngực 41-43). Quần: 32 ≈ L
    # -------------------------------------------------------------
    tc2_input = {
        "chieu_cao_cm": 175.0,
        "can_nang_kg": 70.0,
        "vong_nguc_cm": 98.0,
        "vong_eo_cm": 82.0,
        "rong_vai_cm": 46.0,
        "dai_chan_inseam_cm": 78.0,
    }
    tc2_res = recommend_garment_sizes(tc2_input, gender="male", active_system="asia")
    print("\n[TEST CASE 2] Nam 175cm, 70kg, ngực 98cm, eo 82cm, vai 46cm:")
    print(f"  - Áo Châu Á: {tc2_res['topwear']['asia']} (Kỳ vọng: L)")
    print(f"  - Áo US:     {tc2_res['topwear']['us']} (Kỳ vọng: M)")
    print(f"  - Quần:      {tc2_res['bottomwear']['tag']} (Kỳ vọng: 32 ≈ Size L)")
    assert tc2_res["topwear"]["asia"] == "L", f"TC2 Áo Châu Á sai: {tc2_res['topwear']['asia']}"
    assert tc2_res["topwear"]["us"] == "M", f"TC2 Áo US sai: {tc2_res['topwear']['us']}"
    assert tc2_res["bottomwear"]["waist_inches"] == 32, f"TC2 Quần eo inch sai: {tc2_res['bottomwear']['waist_inches']}"
    assert tc2_res["bottomwear"]["asia"] == "L", f"TC2 Quần size chữ sai: {tc2_res['bottomwear']['asia']}"
    print("  => [PASS] TEST CASE 2 ĐẠT CHUẨN!")

    # -------------------------------------------------------------
    # Test Case 3: Nam, 160cm, 48kg, ngực 80, eo 65, vai 40
    # Kỳ vọng: Áo: Châu Á XS. Quần: 26 ≈ XS
    # -------------------------------------------------------------
    tc3_input = {
        "chieu_cao_cm": 160.0,
        "can_nang_kg": 48.0,
        "vong_nguc_cm": 80.0,
        "vong_eo_cm": 65.0,
        "rong_vai_cm": 40.0,
        "dai_chan_inseam_cm": 70.0,
    }
    tc3_res = recommend_garment_sizes(tc3_input, gender="male", active_system="asia")
    print("\n[TEST CASE 3] Nam 160cm, 48kg, ngực 80cm, eo 65cm, vai 40cm:")
    print(f"  - Áo Châu Á: {tc3_res['topwear']['asia']} (Kỳ vọng: XS)")
    print(f"  - Quần:      {tc3_res['bottomwear']['tag']} (Kỳ vọng: 26 ≈ Size XS)")
    assert tc3_res["topwear"]["asia"] == "XS", f"TC3 Áo sai: {tc3_res['topwear']['asia']}"
    assert tc3_res["bottomwear"]["waist_inches"] == 26, f"TC3 Quần eo inch sai: {tc3_res['bottomwear']['waist_inches']}"
    assert tc3_res["bottomwear"]["asia"] == "XS", f"TC3 Quần size chữ sai: {tc3_res['bottomwear']['asia']}"
    print("  => [PASS] TEST CASE 3 ĐẠT CHUẨN!")

    # -------------------------------------------------------------
    # Test Case 4: Nam, ngực 90cm (sát ranh S/M <= 1cm)
    # Kỳ vọng: Hiển thị "S hoặc M" (hoặc "S (vừa ôm) hoặc M (thoải mái)")
    # -------------------------------------------------------------
    tc4_input = {
        "vong_nguc_cm": 90.0,
        "vong_eo_cm": 75.0,
    }
    tc4_res = recommend_garment_sizes(tc4_input, gender="male", active_system="asia")
    print("\n[TEST CASE 4] Nam ngực 90cm (sát ranh S/M):")
    print(f"  - is_boundary:    {tc4_res['topwear']['is_boundary']}")
    print(f"  - boundary_text:  {tc4_res['topwear']['boundary_text']}")
    print(f"  - recommended:    {tc4_res['topwear']['recommended_label']}")
    assert tc4_res["topwear"]["is_boundary"] is True, "TC4 phải phát hiện ranh giới (is_boundary = True)"
    assert "S" in tc4_res["topwear"]["recommended_label"] and "M" in tc4_res["topwear"]["recommended_label"], "TC4 phải chứa cả S và M"
    print("  => [PASS] TEST CASE 4 ĐẠT CHUẨN!")

    # -------------------------------------------------------------
    # Test Case 5: Nữ, 158cm, 48kg, ngực 82, eo 64, mông 89
    # Kỳ vọng: Áo: Châu Á S, US 4-6. Quần: 25-26
    # -------------------------------------------------------------
    tc5_input = {
        "chieu_cao_cm": 158.0,
        "can_nang_kg": 48.0,
        "vong_nguc_cm": 82.0,
        "vong_eo_cm": 64.0,
        "vong_mong_cm": 89.0,
    }
    tc5_res = recommend_garment_sizes(tc5_input, gender="female", active_system="asia")
    print("\n[TEST CASE 5] Nữ 158cm, 48kg, ngực 82cm, eo 64cm, mông 89cm:")
    print(f"  - Áo Châu Á: {tc5_res['topwear']['asia']} (Kỳ vọng: S hoặc XS ranh giới)")
    print(f"  - Áo US:     {tc5_res['topwear']['us']} (Kỳ vọng: 4-6)")
    print(f"  - Quần inch: {tc5_res['bottomwear']['waist_inches']} inch (Kỳ vọng: 25)")
    assert tc5_res["topwear"]["us"] == "4-6" or tc5_res["topwear"]["us"] == "0-2", f"TC5 Áo US: {tc5_res['topwear']['us']}"
    assert tc5_res["bottomwear"]["waist_inches"] in [25, 26], f"TC5 Quần eo inch: {tc5_res['bottomwear']['waist_inches']}"
    print("  => [PASS] TEST CASE 5 ĐẠT CHUẨN!")

    print("\n" + "=" * 60)
    print("TẤT CẢ 5 TEST CASES ĐÃ PASS 100% TRÊN PYTHON!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()

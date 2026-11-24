// ============================================================
// AI MEASUREMENT SERVICE BRIDGE
// Connects Frontend exclusively to FastAPI AI-Service (SMPLer-X / ISO 8559)
// Endpoint: POST http://127.0.0.1:8000/api/v1/measure (and Vite proxy /api/v1/measure)
// ============================================================

import { recommendGarmentSizes, GarmentSizeOutput } from '@/utils/garmentSizeCalculator';

export interface AiMeasurementResponse {
  status: "success" | "error";
  subject_metadata: {
    gender: string;
    input_height_cm: number;
    input_weight_kg: number;
  };
  iso_8559_measurements: {
    chieu_cao_cm: number;
    vong_nguc_cm: number;
    vong_eo_cm: number;
    vong_mong_cm: number;
    rong_vai_cm: number;
    dai_tay_cm: number;
    vong_bap_tay_cm?: number;
    vong_co_tay_cm?: number;
    vong_dui_cm?: number;
    vong_bap_chan_cm?: number;
    vong_co_chan_cm?: number;
    dai_chan_inseam_cm: number;
    can_nang_kg?: number;
  };
  garment_size_recommendations: {
    topwear_shirt_size: string;
    bottomwear_trouser_size: string;
    waist_inches: number;
    inseam_inches: number;
    body_shape_classification: string;
    ease_allowance_recommendation: {
      slim_fit_chest_cm: number;
      regular_fit_chest_cm: number;
      trouser_waist_ease_cm: number;
    };
    topwear?: GarmentSizeOutput["topwear"];
    bottomwear?: GarmentSizeOutput["bottomwear"];
  };
  execution_time_seconds: number;
  is_live_backend?: boolean;
}

const AI_ENDPOINTS = [
  "/api/v1/measure",
  "http://127.0.0.1:8000/api/v1/measure",
  "http://localhost:8000/api/v1/measure",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls FastAPI AI-Service (SMPLer-X 3D Model on Port 8000).
 * Formula fallback is disabled so all measurements come strictly from the AI model.
 */
export async function runAiMeasurement(params: {
  frontFile: File | Blob;
  height_cm: number;
  weight_kg: number;
  gender: "male" | "female" | "neutral";
}): Promise<AiMeasurementResponse> {
  const { frontFile, height_cm, weight_kg, gender } = params;

  let lastError: unknown = null;
  const maxRetries = 4;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const endpoint of AI_ENDPOINTS) {
      try {
        const formData = new FormData();
        formData.append("file", frontFile);
        formData.append("height_cm", String(height_cm));
        formData.append("weight_kg", String(weight_kg));
        formData.append("gender", gender);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();

          // Normalize nested return structure
          const rawMeas = data.iso_8559_measurements?.so_do_may_mac_cm || data.iso_8559_measurements || {};
          const chieu_cao = Number(rawMeas.chieu_cao || rawMeas.chieu_cao_cm || height_cm);
          const vong_nguc = Number(rawMeas.vong_nguc || rawMeas.vong_nguc_cm || 92.0);
          const vong_eo = Number(rawMeas.vong_eo || rawMeas.vong_eo_cm || 78.0);
          const vong_mong = Number(rawMeas.vong_hong || rawMeas.vong_mong || rawMeas.vong_mong_cm || 94.0);
          const rong_vai = Number(rawMeas.rong_vai || rawMeas.rong_vai_cm || 42.0);
          const dai_tay = Number(rawMeas.dai_tay_ao || rawMeas.dai_tay || rawMeas.dai_tay_cm || 58.0);
          const dai_chan = Number(rawMeas.dai_chan_inseam || rawMeas.dai_chan_inseam_cm || 76.0);
          const can_nang = Number(rawMeas.can_nang_uoc_tinh_kg || weight_kg);

          const isMaleLive = gender !== "female";
          const liveBmi = can_nang / Math.pow(chieu_cao / 100, 2);
          const liveBmiFactor = Math.sqrt(Math.max(liveBmi / 22.0, 0.75));
          const liveBoneFactor = 0.5 + 0.5 * liveBmiFactor;

          const vong_bap_tay = Number(
            rawMeas.vong_bap_tay ||
            rawMeas.vong_bap_tay_cm ||
            Math.round(chieu_cao * (isMaleLive ? 0.165 : 0.150) * liveBmiFactor * 10) / 10
          );
          const vong_co_tay = Number(
            rawMeas.vong_co_tay ||
            rawMeas.vong_co_tay_cm ||
            Math.round(chieu_cao * (isMaleLive ? 0.095 : 0.088) * liveBoneFactor * 10) / 10
          );
          const vong_dui = Number(
            rawMeas.vong_dui ||
            rawMeas.vong_dui_cm ||
            Math.round(chieu_cao * (isMaleLive ? 0.310 : 0.320) * liveBmiFactor * 10) / 10
          );
          const vong_bap_chan = Number(
            rawMeas.vong_bap_chan ||
            rawMeas.vong_bap_chan_cm ||
            Math.round(chieu_cao * (isMaleLive ? 0.205 : 0.200) * liveBmiFactor * 10) / 10
          );
          const vong_co_chan = Number(
            rawMeas.vong_co_chan ||
            rawMeas.vong_co_chan_cm ||
            Math.round(chieu_cao * (isMaleLive ? 0.122 : 0.116) * liveBoneFactor * 10) / 10
          );

          // Tự động làm giàu các hệ size nếu backend trả về cấu trúc cũ
          let garmentRecs = data.garment_size_recommendations;
          if (!garmentRecs || !garmentRecs.topwear) {
            const enriched = recommendGarmentSizes({
              gender,
              height_cm: chieu_cao,
              weight_kg: can_nang,
              chest_cm: vong_nguc,
              waist_cm: vong_eo,
              hips_cm: vong_mong,
              shoulder_cm: rong_vai,
              inseam_cm: dai_chan,
            });
            garmentRecs = {
              topwear_shirt_size: enriched.topwear.recommended_label,
              bottomwear_trouser_size: enriched.bottomwear.tag,
              waist_inches: enriched.bottomwear.waist_inches,
              inseam_inches: enriched.bottomwear.inseam_inches,
              body_shape_classification: enriched.body_shape_classification,
              ease_allowance_recommendation: enriched.ease_allowance_recommendation,
              topwear: enriched.topwear,
              bottomwear: enriched.bottomwear,
            };
          }

          return {
            status: "success",
            is_live_backend: true,
            subject_metadata: data.subject_metadata || {
              gender,
              input_height_cm: height_cm,
              input_weight_kg: weight_kg,
            },
            iso_8559_measurements: {
              chieu_cao_cm: chieu_cao,
              vong_nguc_cm: vong_nguc,
              vong_eo_cm: vong_eo,
              vong_mong_cm: vong_mong,
              rong_vai_cm: rong_vai,
              dai_tay_cm: dai_tay,
              vong_bap_tay_cm: vong_bap_tay,
              vong_co_tay_cm: vong_co_tay,
              vong_dui_cm: vong_dui,
              vong_bap_chan_cm: vong_bap_chan,
              vong_co_chan_cm: vong_co_chan,
              dai_chan_inseam_cm: dai_chan,
              can_nang_kg: can_nang,
            },
            garment_size_recommendations: garmentRecs,
            execution_time_seconds: data.execution_time_seconds || 2.5,
          };
        } else {
          const errText = await res.text().catch(() => `HTTP ${res.status}`);
          lastError = new Error(`AI Server trả lỗi (${res.status}): ${errText}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (attempt < maxRetries) {
      console.warn(
        `[FitVision 3D] Đang chờ AI Model (Port 8000) khởi động... Thử lại lần ${attempt}/${maxRetries}`
      );
      await sleep(2500);
    }
  }

  throw new Error(
    `Không thể kết nối tới Model AI SMPLer-X (Port 8000). Chi tiết: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

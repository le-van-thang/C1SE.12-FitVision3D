import { env } from '../../config/env.js';
import { AppError } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cachedToken: CachedToken | null = null;

export interface PayPalCaptureSummary {
  paypalOrderId: string;
  captureId: string;
  status: string;
  grossUsd: number;
  paypalFeeUsd: number;
  netUsd: number;
  payerEmail: string | null;
  raw: any;
}

export interface PayPalPayoutBatchResult {
  batchId: string;
  batchStatus: string;
  items: Array<{
    payoutItemId: string | null;
    senderItemId: string | null;
    receiver: string | null;
    transactionStatus: string | null;
    itemError: string | null;
  }>;
  raw: any;
}

export function convertVndToUsd(amountVnd: number, exchangeRateVnd = env.PAYPAL_VND_RATE): number {
  const safeRate = Number.isFinite(exchangeRateVnd) && exchangeRateVnd > 0 ? exchangeRateVnd : 25400;
  const safeVnd = Number(amountVnd) || 0;
  if (safeVnd <= 0) return 0;
  return Math.max(0.01, Math.round((safeVnd / safeRate) * 100) / 100);
}

export function convertUsdToVnd(amountUsd: number, exchangeRateVnd = env.PAYPAL_VND_RATE): number {
  const safeRate = Number.isFinite(exchangeRateVnd) && exchangeRateVnd > 0 ? exchangeRateVnd : 25400;
  const safeUsd = Number(amountUsd) || 0;
  if (safeUsd <= 0) return 0;
  return Math.round(safeUsd * safeRate);
}

async function getAccessToken(): Promise<string> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new AppError(
      503,
      ErrorCode.VALIDATION_FAILED,
      'Hệ thống chưa cấu hình PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET trong backend/.env.'
    );
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs > now + 60_000) {
    return cachedToken.accessToken;
  }

  const basic = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.access_token) {
    throw new AppError(
      502,
      ErrorCode.VALIDATION_FAILED,
      `Không thể xác thực PayPal OAuth (${data?.error_description || data?.error || res.status}).`
    );
  }

  const expiresInSec = Number(data.expires_in) || 3000;
  cachedToken = {
    accessToken: String(data.access_token),
    expiresAtMs: now + expiresInSec * 1000,
  };
  return cachedToken.accessToken;
}

export const paypalService = {
  isConfigured(): boolean {
    return Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
  },

  getPublicConfig() {
    return {
      configured: this.isConfigured(),
      mode: env.PAYPAL_MODE,
      clientId: env.PAYPAL_CLIENT_ID,
      vndRate: env.PAYPAL_VND_RATE,
      platformFeeRate: env.PAYPAL_PLATFORM_FEE_RATE,
      holdDays: env.PAYPAL_HOLD_DAYS,
    };
  },

  async createOrder(params: {
    referenceId: string;
    totalUsd: number;
    description: string;
  }): Promise<{ id: string; status: string; approveUrl: string | null }> {
    const token = await getAccessToken();
    const res = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `fv3d-ord-${params.referenceId}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.referenceId,
            description: params.description.slice(0, 127),
            amount: {
              currency_code: 'USD',
              value: params.totalUsd.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'FitVision 3D Atelier',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      const detail = data?.details?.[0]?.description || data?.message || `HTTP ${res.status}`;
      throw new AppError(502, ErrorCode.VALIDATION_FAILED, `PayPal tạo đơn thất bại: ${detail}`);
    }

    const approveLink = Array.isArray(data.links)
      ? data.links.find((l: any) => l.rel === 'approve')?.href || null
      : null;

    return {
      id: String(data.id),
      status: String(data.status || 'CREATED'),
      approveUrl: approveLink,
    };
  },

  async captureOrder(paypalOrderId: string): Promise<PayPalCaptureSummary> {
    const token = await getAccessToken();
    const res = await fetch(
      `${env.PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
      }
    );

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data?.details?.[0]?.description || data?.message || `HTTP ${res.status}`;
      throw new AppError(400, ErrorCode.VALIDATION_FAILED, `PayPal thu tiền không thành công: ${detail}`);
    }

    const pu = Array.isArray(data?.purchase_units) ? data.purchase_units[0] : null;
    const capture = Array.isArray(pu?.payments?.captures) ? pu.payments.captures[0] : null;
    const breakdown = capture?.seller_receivable_breakdown || {};

    const grossUsd = Number(capture?.amount?.value ?? pu?.amount?.value ?? 0) || 0;
    const paypalFeeUsd = Number(breakdown?.paypal_fee?.value ?? 0) || 0;
    const netUsd = Number(breakdown?.net_amount?.value ?? Math.max(0, grossUsd - paypalFeeUsd)) || 0;

    return {
      paypalOrderId: String(data.id || paypalOrderId),
      captureId: String(capture?.id || ''),
      status: String(capture?.status || data.status || 'UNKNOWN'),
      grossUsd,
      paypalFeeUsd,
      netUsd,
      payerEmail: data?.payer?.email_address ? String(data.payer.email_address) : null,
      raw: data,
    };
  },

  async verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    webhookEvent: any
  ): Promise<boolean> {
    if (!env.PAYPAL_WEBHOOK_ID) {
      return env.NODE_ENV !== 'production';
    }
    const readHdr = (key: string) => {
      const v = headers[key] ?? headers[key.toLowerCase()];
      return Array.isArray(v) ? v[0] : v || '';
    };
    const token = await getAccessToken();
    const res = await fetch(`${env.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: readHdr('paypal-auth-algo'),
        cert_url: readHdr('paypal-cert-url'),
        transmission_id: readHdr('paypal-transmission-id'),
        transmission_sig: readHdr('paypal-transmission-sig'),
        transmission_time: readHdr('paypal-transmission-time'),
        webhook_id: env.PAYPAL_WEBHOOK_ID,
        webhook_event: webhookEvent,
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    return res.ok && data?.verification_status === 'SUCCESS';
  },

  async createBatchPayout(params: {
    senderBatchId: string;
    emailSubject: string;
    emailMessage: string;
    items: Array<{
      senderItemId: string;
      receiverEmail: string;
      amountUsd: number;
      note: string;
    }>;
  }): Promise<PayPalPayoutBatchResult> {
    const token = await getAccessToken();
    const res = await fetch(`${env.PAYPAL_API_BASE}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: params.senderBatchId,
          email_subject: params.emailSubject.slice(0, 255),
          email_message: params.emailMessage.slice(0, 1000),
        },
        items: params.items.map((it) => ({
          recipient_type: 'EMAIL',
          amount: {
            value: Math.max(0.01, it.amountUsd).toFixed(2),
            currency: 'USD',
          },
          note: it.note.slice(0, 4000),
          sender_item_id: it.senderItemId,
          receiver: it.receiverEmail.trim(),
        })),
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.batch_header?.payout_batch_id) {
      const detail =
        data?.details?.[0]?.issue ||
        data?.details?.[0]?.description ||
        data?.message ||
        `HTTP ${res.status}`;
      throw new AppError(
        502,
        ErrorCode.VALIDATION_FAILED,
        `PayPal Payouts giải ngân thất bại (${detail}). Kiểm tra số dư PayPal Business hoặc quyền Payouts trên tài khoản.`
      );
    }

    const batchId = String(data.batch_header.payout_batch_id);
    const batchStatus = String(data.batch_header.batch_status || 'PENDING');

    // Query immediately once if available to capture item IDs, ignore non-fatal errors
    let parsedItems: PayPalPayoutBatchResult['items'] = [];
    try {
      const statusInfo = await this.getBatchPayoutStatus(batchId);
      parsedItems = statusInfo.items;
    } catch {
      parsedItems = params.items.map((it) => ({
        payoutItemId: null,
        senderItemId: it.senderItemId,
        receiver: it.receiverEmail,
        transactionStatus: batchStatus,
        itemError: null,
      }));
    }

    return {
      batchId,
      batchStatus,
      items: parsedItems,
      raw: data,
    };
  },

  async getBatchPayoutStatus(payoutBatchId: string): Promise<{
    batchId: string;
    batchStatus: string;
    items: PayPalPayoutBatchResult['items'];
    raw: any;
  }> {
    const token = await getAccessToken();
    const res = await fetch(
      `${env.PAYPAL_API_BASE}/v1/payments/payouts/${encodeURIComponent(payoutBatchId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new AppError(502, ErrorCode.VALIDATION_FAILED, 'Không thể truy vấn trạng thái batch giải ngân PayPal.');
    }
    const items = Array.isArray(data?.items)
      ? data.items.map((item: any) => {
          const errName = item?.errors?.name ? String(item.errors.name).trim() : '';
          const errMsg = item?.errors?.message ? String(item.errors.message).trim() : '';
          const itemError = errName && errMsg ? `${errName}: ${errMsg}` : errName || errMsg || null;
          return {
            payoutItemId: item?.payout_item_id ? String(item.payout_item_id) : null,
            senderItemId: item?.payout_item?.sender_item_id ? String(item.payout_item.sender_item_id) : null,
            receiver: item?.payout_item?.receiver ? String(item.payout_item.receiver) : null,
            transactionStatus: item?.transaction_status ? String(item.transaction_status) : null,
            itemError,
          };
        })
      : [];

    return {
      batchId: String(data?.batch_header?.payout_batch_id || payoutBatchId),
      batchStatus: String(data?.batch_header?.batch_status || 'PROCESSING'),
      items,
      raw: data,
    };
  },
};


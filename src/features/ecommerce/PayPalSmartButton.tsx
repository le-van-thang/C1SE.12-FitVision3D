import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface PayPalSmartButtonProps {
  clientId: string;
  disabled?: boolean;
  onValidateBeforeCreate: () => string | null;
  onCreateServerOrder: () => Promise<string | null>;
  onApproveServerCapture: (paypalOrderId: string) => Promise<void>;
  onCancelOrError: (paypalOrderId: string | null, reason?: string) => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export const PayPalSmartButton: React.FC<PayPalSmartButtonProps> = ({
  clientId,
  disabled = false,
  onValidateBeforeCreate,
  onCreateServerOrder,
  onApproveServerCapture,
  onCancelOrError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPayPalOrderIdRef = useRef<string | null>(null);
  const [sdkState, setSdkState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sdkErr, setSdkErr] = useState<string | null>(null);

  const callbacksRef = useRef({
    onValidateBeforeCreate,
    onCreateServerOrder,
    onApproveServerCapture,
    onCancelOrError,
  });
  callbacksRef.current = {
    onValidateBeforeCreate,
    onCreateServerOrder,
    onApproveServerCapture,
    onCancelOrError,
  };

  useEffect(() => {
    if (!clientId) {
      setSdkState('error');
      setSdkErr('Chưa cấu hình PAYPAL_CLIENT_ID / VITE_PAYPAL_CLIENT_ID.');
      return;
    }

    let cancelled = false;
    let buttonsInstance: any = null;
    const scriptId = 'fv3d-paypal-sdk';
    const expectedSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;

    const mountButtons = () => {
      if (cancelled || !containerRef.current || !window.paypal?.Buttons) return;
      if (buttonsInstance?.close) {
        void buttonsInstance.close().catch(() => undefined);
        buttonsInstance = null;
      }
      containerRef.current.replaceChildren();
      setSdkState('ready');
      setSdkErr(null);

      try {
        buttonsInstance = window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            height: 44,
          },
          onClick: (_data: any, actions: any) => {
            const validationMsg = callbacksRef.current.onValidateBeforeCreate();
            if (validationMsg) {
              return actions.reject();
            }
            return actions.resolve();
          },
          createOrder: async () => {
            try {
              const id = await callbacksRef.current.onCreateServerOrder();
              if (!id) {
                throw new Error('Không thể khởi tạo giao dịch PayPal trên máy chủ.');
              }
              lastPayPalOrderIdRef.current = id;
              return id;
            } catch (err: any) {
              throw new Error(
                err?.message || 'Không thể khởi tạo giao dịch PayPal trên máy chủ.'
              );
            }
          },
          onApprove: async (data: any) => {
            const oid = String(data?.orderID || lastPayPalOrderIdRef.current || '');
            await callbacksRef.current.onApproveServerCapture(oid);
            lastPayPalOrderIdRef.current = null;
          },
          onCancel: () => {
            const oid = lastPayPalOrderIdRef.current;
            lastPayPalOrderIdRef.current = null;
            callbacksRef.current.onCancelOrError(
              oid,
              'Bạn đã đóng cửa sổ thanh toán PayPal.'
            );
          },
          onError: (err: any) => {
            const oid = lastPayPalOrderIdRef.current;
            lastPayPalOrderIdRef.current = null;
            callbacksRef.current.onCancelOrError(
              oid,
              err?.message || 'Giao dịch PayPal gặp sự cố. Vui lòng thử lại.'
            );
          },
        });
        if (buttonsInstance.isEligible && !buttonsInstance.isEligible()) {
          return;
        }
        buttonsInstance.render(containerRef.current).catch(() => undefined);
      } catch (e: any) {
        if (!cancelled) {
          setSdkState('error');
          setSdkErr(e?.message || 'Không thể khởi tạo nút PayPal.');
        }
      }
    };

    const cleanup = () => {
      cancelled = true;
      if (buttonsInstance?.close) {
        void buttonsInstance.close().catch(() => undefined);
        buttonsInstance = null;
      }
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing && window.paypal?.Buttons && existing.src === expectedSrc) {
      mountButtons();
      return cleanup;
    }

    if (existing && existing.src !== expectedSrc) {
      existing.remove();
      delete window.paypal;
    }

    setSdkState('loading');
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = expectedSrc;
    script.async = true;
    script.onload = () => mountButtons();
    script.onerror = () => {
      if (!cancelled) {
        setSdkState('error');
        setSdkErr('Không tải được PayPal SDK từ paypal.com. Vui lòng kiểm tra kết nối mạng hoặc PAYPAL_CLIENT_ID.');
      }
    };
    document.body.appendChild(script);

    return cleanup;
  }, [clientId]);

  if (sdkState === 'error') {
    return (
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 text-left">
        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">{sdkErr}</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Đảm bảo đã cấu hình `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` ở `backend/.env` (hoặc `VITE_PAYPAL_CLIENT_ID` ở `.env`).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {sdkState === 'loading' && (
        <div className="py-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
          <Loader2 size={15} className="animate-spin text-blue-600" />
          <span>Đang tải cổng thanh toán PayPal...</span>
        </div>
      )}
      <div ref={containerRef} className="min-h-[46px]" />
    </div>
  );
};


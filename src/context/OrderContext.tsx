import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Order, CreateOrderInput, OrderStatus } from '@/features/ecommerce/types';
import { commerceApi } from '@/services/commerceApi';
import { useAuth } from '@/context/AuthContext';
import { showGlobalToast } from '@/components/common/GlobalToastHost';

export interface CreateOrderResult {
  success: boolean;
  order?: Order;
  error?: string;
}

interface OrderContextType {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => Promise<CreateOrderResult>;
  recordCapturedOrders: (capturedOrders: Order[]) => void;
  refreshOrders: () => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => void;
  markPaymentCompleted: (orderId: string) => void;
  getUserOrders: (customerId?: string) => Order[];
  getStoreOrders: (storeName?: string) => Order[];
}

const getOrderStorageKey = (userId?: string | null) =>
  `fv3d_orders_store_v2_${userId || 'anon'}`;

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  // Strict auth gate: clear orders on logout, fetch actor-scoped orders on login
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) {
      setOrders([]);
      return;
    }

    try {
      const cached = localStorage.getItem(getOrderStorageKey(currentUser.id));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setOrders(parsed);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    }

    let active = true;
    commerceApi.getOrders().then((res) => {
      if (active && res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated, currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    try {
      localStorage.setItem(getOrderStorageKey(currentUser.id), JSON.stringify(orders));
    } catch (err) {
      console.error('Failed to save orders to localStorage:', err);
    }
  }, [orders, isAuthenticated, currentUser?.id]);

  const refreshOrders = useCallback(async (): Promise<Order[]> => {
    if (!isAuthenticated || !currentUser?.id) return [];
    const res = await commerceApi.getOrders();
    if (res.success && Array.isArray(res.data)) {
      setOrders(res.data);
      return res.data;
    }
    return [];
  }, [isAuthenticated, currentUser?.id]);

  const createOrder = useCallback(
    async (input: CreateOrderInput): Promise<CreateOrderResult> => {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const orderId = `FV3D-${randomNum}`;
      const hasBespoke =
        input.has_bespoke_items ?? input.items.some((it) => Boolean(it.product?.is_bespoke));

      const newOrder: Order & { coupon_code?: string } = {
        id: orderId,
        customer_id: currentUser?.id || input.customer_id,
        customer_name: input.customer_name,
        recipient: input.recipient,
        items: input.items,
        coupon_code: input.coupon_code,
        subtotal: input.subtotal,
        shipping_fee: input.shipping_fee,
        discount_amount: input.discount_amount,
        total_amount: input.total_amount,
        payment_method: input.payment_method,
        payment_status: 'unpaid',
        status: 'pending',
        created_at: new Date().toISOString(),
        store_name: input.store_name || (input.items[0]?.product.brand_name ?? 'FitVision Atelier'),
        has_bespoke_items: hasBespoke,
        measurement_snapshot: input.measurement_snapshot ?? null,
        estimated_delivery: new Date(Date.now() + 4 * 24 * 3600 * 1000).toLocaleDateString('vi-VN'),
      };

      const res = await commerceApi.createOrder(newOrder);
      if (res.success && res.data) {
        const persisted = res.data;
        setOrders((prev) => [persisted, ...prev.filter((o) => o.id !== persisted.id)]);
        showGlobalToast({
          type: 'success',
          title: `Đặt đơn hàng ${persisted.id} thành công!`,
          message: `Tổng thanh toán ${Number(persisted.total_amount || 0).toLocaleString('vi-VN')}₫.`,
        });
        window.dispatchEvent(new Event('fv3d-membership-updated'));
        return { success: true, order: persisted };
      }

      const errorMsg =
        res.error?.code === 'NETWORK_ERROR'
          ? 'Không thể kết nối máy chủ đặt hàng. Giỏ hàng của bạn vẫn được giữ nguyên, vui lòng thử lại.'
          : res.error?.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại tồn kho sản phẩm.';
      showGlobalToast({
        type: 'error',
        title: 'Không thể tạo đơn hàng',
        message: errorMsg,
      });
      return { success: false, error: errorMsg };
    },
    [currentUser?.id]
  );

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    let prevStatus: OrderStatus | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          prevStatus = o.status;
          return { ...o, status };
        }
        return o;
      })
    );
    commerceApi.updateOrderStatus(orderId, status).then((res) => {
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data! : o)));
        window.dispatchEvent(new Event('fv3d-membership-updated'));
      } else {
        if (prevStatus) {
          const rollbackStatus = prevStatus;
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: rollbackStatus } : o))
          );
        }
        showGlobalToast({
          type: 'error',
          title: 'Không thể cập nhật trạng thái đơn',
          message: res.error?.message || 'Thao tác không hợp lệ.',
        });
      }
    });
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    let prevStatus: OrderStatus | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          prevStatus = o.status;
          return { ...o, status: 'cancelled' };
        }
        return o;
      })
    );
    commerceApi.updateOrderStatus(orderId, 'cancelled').then((res) => {
      if (res.success) {
        if (res.data) {
          setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data! : o)));
        }
        showGlobalToast({
          type: 'warning',
          title: `Đã hủy đơn hàng ${orderId}`,
          message: 'Đã hoàn trả số lượng tồn kho và cập nhật trạng thái đơn.',
        });
        window.dispatchEvent(new Event('fv3d-membership-updated'));
      } else {
        if (prevStatus) {
          const rollbackStatus = prevStatus;
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: rollbackStatus } : o))
          );
        }
        showGlobalToast({
          type: 'error',
          title: 'Không thể hủy đơn hàng',
          message: res.error?.message || 'Đơn hàng đã chuyển sang trạng thái không thể hủy.',
        });
      }
    });
  }, []);

  const markPaymentCompleted = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, payment_status: 'paid' } : o))
    );
  }, []);

  const recordCapturedOrders = useCallback((capturedOrders: Order[]) => {
    if (!Array.isArray(capturedOrders) || capturedOrders.length === 0) return;
    setOrders((prev) => {
      const capturedIds = new Set(capturedOrders.map((o) => o.id));
      return [...capturedOrders, ...prev.filter((o) => !capturedIds.has(o.id))];
    });
    window.dispatchEvent(new Event('fv3d-membership-updated'));
  }, []);

  const getUserOrders = useCallback(
    (customerId?: string) => {
      if (!isAuthenticated || !customerId) return [];
      return orders.filter((o) => o.customer_id === customerId);
    },
    [orders, isAuthenticated]
  );

  const getStoreOrders = useCallback(
    (storeName?: string) => {
      if (!isAuthenticated) return [];
      if (!storeName) return orders;
      return orders.filter(
        (o) => o.store_name && o.store_name.toLowerCase().includes(storeName.toLowerCase())
      );
    },
    [orders, isAuthenticated]
  );

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        recordCapturedOrders,
        refreshOrders,
        updateOrderStatus,
        cancelOrder,
        markPaymentCompleted,
        getUserOrders,
        getStoreOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    return {
      orders: [],
      createOrder: async () => ({ success: false, error: 'OrderProvider missing' }),
      recordCapturedOrders: () => {},
      refreshOrders: async () => [],
      updateOrderStatus: () => {},
      cancelOrder: () => {},
      markPaymentCompleted: () => {},
      getUserOrders: () => [],
      getStoreOrders: () => [],
    };
  }
  return context;
};

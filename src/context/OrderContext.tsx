import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Order, CreateOrderInput, OrderStatus } from '@/features/ecommerce/types';
import { MOCK_PRODUCTS } from '@/features/ecommerce/mockProducts';

interface OrderContextType {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => void;
  markPaymentCompleted: (orderId: string) => void;
  getUserOrders: (customerId?: string) => Order[];
  getStoreOrders: (storeName?: string) => Order[];
}

const STORAGE_KEY = 'fv3d_orders_store_v1';

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'FV3D-95123',
    customer_id: 'usr-101',
    customer_name: 'Lê Văn Thắng',
    recipient: {
      full_name: 'Lê Văn Thắng',
      phone: '0979 307 635',
      address: 'Số 12 Đường Bách Khoa, P. Hòa Khánh Bắc, Q. Liên Chiểu',
      city: 'Đà Nẵng',
      note: 'Giao giờ hành chính, may theo đúng số đo vòng ngực 96cm.',
    },
    items: [
      {
        id: 'cart-sample-1',
        product: MOCK_PRODUCTS[0], // Blazer Sartoria
        variant: MOCK_PRODUCTS[0].variants[2] || MOCK_PRODUCTS[0].variants[0],
        quantity: 1,
        fit_score: 98,
        is_ai_recommended: true,
      },
    ],
    subtotal: 1650000,
    shipping_fee: 0,
    discount_amount: 0,
    total_amount: 1650000,
    payment_method: 'vietqr_sepay',
    payment_status: 'paid',
    status: 'tailoring',
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    store_name: 'Nhà May Sartoria Ý',
    estimated_delivery: '18/11/2026',
  },
  {
    id: 'FV3D-94812',
    customer_id: 'usr-101',
    customer_name: 'Lê Văn Thắng',
    recipient: {
      full_name: 'Lê Văn Thắng',
      phone: '0979 307 635',
      address: 'Ký Túc Xá Đại Học Bách Khoa, 54 Nguyễn Lương Bằng',
      city: 'Đà Nẵng',
      note: 'Vui lòng gọi trước khi giao.',
    },
    items: [
      {
        id: 'cart-sample-2',
        product: MOCK_PRODUCTS[1] || MOCK_PRODUCTS[0], // Sơ mi Oxford
        variant: (MOCK_PRODUCTS[1] || MOCK_PRODUCTS[0]).variants[1] || (MOCK_PRODUCTS[1] || MOCK_PRODUCTS[0]).variants[0],
        quantity: 2,
        fit_score: 97,
        is_ai_recommended: true,
      },
    ],
    subtotal: 1180000,
    shipping_fee: 0,
    discount_amount: 100000,
    total_amount: 1080000,
    payment_method: 'cod',
    payment_status: 'paid',
    status: 'completed',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    store_name: 'Atelier Maison Vell',
    estimated_delivery: '10/11/2026',
  },
  {
    id: 'FV3D-96204',
    customer_id: 'usr-102',
    customer_name: 'TS. Lê Minh Thái',
    recipient: {
      full_name: 'TS. Lê Minh Thái',
      phone: '0912 345 678',
      address: 'Phòng Lab Trí Tuệ Nhân Tạo, Tòa nhà C1',
      city: 'Đà Nẵng',
      note: 'Đơn hàng đặt may mẫu nghiên cứu nhân trắc học.',
    },
    items: [
      {
        id: 'cart-sample-3',
        product: MOCK_PRODUCTS[2] || MOCK_PRODUCTS[0],
        variant: (MOCK_PRODUCTS[2] || MOCK_PRODUCTS[0]).variants[0],
        quantity: 1,
        fit_score: 99,
        is_ai_recommended: true,
      },
    ],
    subtotal: 1250000,
    shipping_fee: 0,
    discount_amount: 0,
    total_amount: 1250000,
    payment_method: 'vietqr_sepay',
    payment_status: 'paid',
    status: 'shipping',
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    store_name: 'Nhà May Sartoria Ý',
    estimated_delivery: '16/11/2026',
  },
];

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_MOCK_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.error('Failed to save orders to localStorage:', err);
    }
  }, [orders]);

  const createOrder = useCallback((input: CreateOrderInput): Order => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `FV3D-${randomNum}`;

    const newOrder: Order = {
      id: orderId,
      customer_id: input.customer_id,
      customer_name: input.customer_name,
      recipient: input.recipient,
      items: input.items,
      subtotal: input.subtotal,
      shipping_fee: input.shipping_fee,
      discount_amount: input.discount_amount,
      total_amount: input.total_amount,
      payment_method: input.payment_method,
      payment_status: input.payment_method === 'vietqr_sepay' ? 'paid' : 'unpaid',
      status: 'pending',
      created_at: new Date().toISOString(),
      store_name: input.store_name || (input.items[0]?.product.brand_name ?? 'FitVision Atelier'),
      estimated_delivery: new Date(Date.now() + 4 * 24 * 3600 * 1000).toLocaleDateString('vi-VN'),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    );
  }, []);

  const markPaymentCompleted = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, payment_status: 'paid' } : o))
    );
  }, []);

  const getUserOrders = useCallback(
    (customerId?: string) => {
      if (!customerId) return orders;
      // return orders matching customer_id, or if customerId is demo user 'usr-101' / current user
      return orders.filter(
        (o) => o.customer_id === customerId || o.customer_name.toLowerCase().includes('thắng')
      );
    },
    [orders]
  );

  const getStoreOrders = useCallback(
    (storeName?: string) => {
      if (!storeName) return orders;
      return orders.filter(
        (o) => !o.store_name || o.store_name.toLowerCase().includes(storeName.toLowerCase())
      );
    },
    [orders]
  );

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
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
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

import { create } from 'zustand';

interface NotificationState {
  pendingOrdersCount: number;
  newOrdersBadgeCount: number; // For the badge that increments on new orders
  setPendingOrdersCount: (count: number) => void;
  addPendingOrder: () => void;
  resetNewOrdersBadge: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  pendingOrdersCount: 0,
  newOrdersBadgeCount: 0,
  setPendingOrdersCount: (count) => set({ pendingOrdersCount: count }),
  addPendingOrder: () => set((state) => ({ newOrdersBadgeCount: state.newOrdersBadgeCount + 1 })),
  resetNewOrdersBadge: () => set({ newOrdersBadgeCount: 0 }),
}));

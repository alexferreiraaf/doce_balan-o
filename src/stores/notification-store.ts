import { create } from 'zustand';

interface NotificationState {
  pendingOrdersCount: number;
  setPendingOrdersCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  pendingOrdersCount: 0,
  setPendingOrdersCount: (count) => set({ pendingOrdersCount: count }),
}));

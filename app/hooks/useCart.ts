import { create } from "zustand";
import { persist } from "zustand/middleware";
import useAuthStore from "./useAuth";

interface CartItem {
  _id: string;
  event: {
    _id: string;
    title: string;
    image: string;
    date: string;
    price: number;
  };
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        const { user } = useAuthStore.getState();
        // Admin rolüne sahip kullanıcılar sepete ürün ekleyemez
        if (user?.role === 'admin') return;

        set((state) => {
          // Eğer ürün zaten sepette varsa ekleme yapma
          const existingItem = state.items.find((i) => i.event._id === item.event._id);
          if (existingItem) return state;

          // Yeni ürünü ekle, quantity her zaman 1 olacak
          return {
            items: [...state.items, { ...item, quantity: 1 }]
          };
        });
      },

      removeItem: (itemId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item._id !== itemId),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getItemCount: () => {
        return get().items.length;
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.event.price,
          0
        );
      },
    }),
    {
      name: "shopping-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.log('Sepet verileri yüklenirken hata oluştu:', error);
          } else {
            // Kullanıcının çıkış yapıp yapmadığını kontrol et
            const { user } = useAuthStore.getState();

            // Kullanıcı çıkış yapmışsa sepeti temizle
            if (!user && state) {
              state.clearCart();
            }
          }
        };
      },
      merge: (persistedState: any, currentState) => {
        const { user } = useAuthStore.getState();

        // Admin kullanıcılar için boş sepet döndür
        if (user?.role === 'admin') {
          return { ...currentState, items: [] };
        }

        // Normal kullanıcılar için mevcut sepeti kullan
        return { ...currentState, ...(persistedState as any) };
      },
    }
  )
);

// Auth değişiklikleri dinlemek için listener ekle
useAuthStore.subscribe((state, prevState) => {
  // Çıkış yapıldığında sepeti temizle
  if (prevState.user && !state.user) {
    useCart.getState().clearCart();
  }
});

export default useCart;
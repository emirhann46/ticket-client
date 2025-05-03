import { create } from "zustand";
import { persist, createJSONStorage, type StorageValue } from "zustand/middleware";
import type { Event as CustomEventType } from "@/app/constans/type";
import useAuthStore from "@/app/hooks/useAuth";

// Cart item tipini tanımlıyoruz
export interface CartItem {
  eventId: string;
  event: CustomEventType;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (event: CustomEventType) => void;
  removeFromCart: (eventId: string) => void;
  clearCart: () => void;
  isInCart: (eventId: string) => boolean;
  getItemsCount: () => number;
  hydrateCart: () => void;
  preserveCartOnLogout: () => void;
}

// Sepet değişikliklerini bildiren özel event
const triggerCartUpdate = () => {
  if (typeof window !== 'undefined') {
    const event = new Event("cartUpdated");
    document.dispatchEvent(event);
    window.dispatchEvent(new Event("storage"));
  }
};

// Geçici sepet için storage anahtarı
const TEMP_CART_STORAGE_KEY = "temp-cart-items";

// Custom storage oluşturma - Zustand persist middleware'in beklediği tipler ile uyumlu
const customStorage = {
  getItem: (name: string): Promise<string | null> => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem(name);
      return Promise.resolve(value);
    }
    return Promise.resolve(null);
  },
  setItem: (name: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(name, value);
    }
    return Promise.resolve();
  },
  removeItem: (name: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(name);
    }
    return Promise.resolve();
  },
};

// useCart hook'unu oluşturuyoruz ve localStorage ile persist ediyoruz
const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (event: CustomEventType) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(item => item.eventId === event._id);

        // Her etkinlikten sadece 1 tane ekleyebilirsiniz
        if (existingItemIndex >= 0) {
          return;
        }

        set((state) => ({
          items: [
            ...state.items,
            {
              eventId: event._id,
              event: event,
              quantity: 1
            }
          ]
        }));

        triggerCartUpdate();
      },

      removeFromCart: (eventId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.eventId !== eventId)
        }));

        triggerCartUpdate();
      },

      clearCart: () => {
        // Geçici saklanan sepeti de temizle
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TEMP_CART_STORAGE_KEY);
        }

        set({ items: [] });
        triggerCartUpdate();
      },

      isInCart: (eventId: string) => {
        const { items } = get();
        return items.some(item => item.eventId === eventId);
      },

      getItemsCount: () => {
        const { items } = get();
        return items.length;
      },

      hydrateCart: () => {
        if (typeof window !== 'undefined') {
          try {
            // Kullanıcı durumunu kontrol et
            const isAuthenticated = useAuthStore.getState().isAuthenticated;

            // Eğer kullanıcı giriş yapmışsa, normal sepet verisini yükle
            const storedCart = localStorage.getItem('cart-storage');
            if (storedCart) {
              try {
                const parsedCart = JSON.parse(storedCart);
                if (parsedCart && parsedCart.state && parsedCart.state.items) {
                  set({ items: parsedCart.state.items });
                }
              } catch (error) {
                console.error('Sepet verileri yüklenirken hata oluştu:', error);
              }
            }

            // Eğer kullanıcı giriş yaptıysa ve geçici sepet varsa, bunları birleştir
            if (isAuthenticated) {
              const tempCart = localStorage.getItem(TEMP_CART_STORAGE_KEY);
              if (tempCart) {
                try {
                  const tempItems = JSON.parse(tempCart);
                  if (Array.isArray(tempItems) && tempItems.length > 0) {
                    // Sepette olmayan ürünleri ekle
                    const currentItems = get().items;

                    tempItems.forEach(tempItem => {
                      if (!currentItems.some(item => item.eventId === tempItem.eventId)) {
                        set((state) => ({
                          items: [...state.items, tempItem]
                        }));
                      }
                    });

                    // Geçici sepeti temizle
                    localStorage.removeItem(TEMP_CART_STORAGE_KEY);
                    triggerCartUpdate();
                  }
                } catch (error) {
                  console.error('Geçici sepet verileri yüklenirken hata oluştu:', error);
                }
              }
            }
          } catch (error) {
            console.error('Sepet hidrasyonu sırasında hata:', error);
          }
        }
      },

      // Kullanıcı çıkış yapacağı zaman sepeti geçici olarak sakla
      preserveCartOnLogout: () => {
        const { items } = get();
        if (typeof window !== 'undefined' && items.length > 0) {
          localStorage.setItem(TEMP_CART_STORAGE_KEY, JSON.stringify(items));
        }
      }
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => customStorage)
    }
  )
);

// Sayfa yüklendiğinde sepeti hidratlama işlemini başlat
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    useCart.getState().hydrateCart();
  });
}

export default useCart;

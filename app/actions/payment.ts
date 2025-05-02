import axios from "axios";
import useAuthStore from "@/app/hooks/useAuth";
import useCartStore, { CartItem } from "@/app/hooks/useCart";

interface CheckoutData {
  cartItems: CartItem[];
  userId: string;
  contactInfo: {
    email: string;
    phone: string;
  };
}

// İyzico için ödeme başlatma
export const initiatePayment = async (checkoutData: CheckoutData) => {
  try {
    // JWT token'ı al
    const { getJwt } = useAuthStore.getState();
    const token = getJwt();

    if (!token) {
      throw new Error("Yetkilendirme hatası! Giriş yapmalısınız.");
    }

    // Siparişi oluştur - Backend API'ye istek at
    const response = await axios.post(
      "http://localhost:1337/api/payment/initiate",
      checkoutData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // İyzico'dan gelen ödeme sayfası URL veya token bilgisini döndür
    if (response.data && response.data.paymentPageUrl) {
      return {
        success: true,
        paymentPageUrl: response.data.paymentPageUrl,
        paymentToken: response.data.token
      };
    } else {
      throw new Error("Ödeme başlatılamadı. Sunucudan geçerli bir yanıt alınamadı.");
    }
  } catch (error: any) {
    console.error("Ödeme başlatılırken hata:", error);
    let errorMessage = "Ödeme işlemi sırasında bir hata oluştu";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

// İyzico'dan gelen ödeme sonucunu doğrula
export const verifyPayment = async (token: string) => {
  try {
    // JWT token'ı al
    const { getJwt } = useAuthStore.getState();
    const authToken = getJwt();

    if (!authToken) {
      throw new Error("Yetkilendirme hatası! Giriş yapmalısınız.");
    }

    // Ödemeyi doğrula
    const response = await axios.post(
      "http://localhost:1337/api/payment/verify",
      { token },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    // Başarılı ödeme sonrası sepeti temizle
    if (response.data && response.data.success) {
      const { clearCart } = useCartStore.getState();
      clearCart();
    }

    return response.data;
  } catch (error: any) {
    console.error("Ödeme doğrulanırken hata:", error);
    let errorMessage = "Ödeme doğrulama sırasında bir hata oluştu";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../constans/type";
import axios from "axios";
import Cookies from 'js-cookie';
import { toast } from "react-hot-toast";
import { startSession, endSession } from "@/lib/session";

// Hata gösterme durumunu kontrol eden değişken
let isErrorShown = false;

// Auth hata mesajları için tost ID'si
const AUTH_TOAST_ID = "auth-error";

interface AuthState {
  jwt: string;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setJwt: (jwt: string) => void;
  setUser: (userData: any) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  logout: () => void;
  error: string | null;
  getJwt: () => string | null;
  refreshUserData: () => Promise<User | null>;
  checkAdminRole: () => boolean;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      jwt: "",
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setJwt: (jwt: string) => {
        if (!jwt) {
          console.warn("Token boş olamaz");
          return;
        }

        // Token'ı hem store'da hem cookie'de sakla
        try {
          localStorage.setItem("jwt", jwt);
          Cookies.set('jwt', jwt, { expires: 7, path: '/' });
          console.log("Token kaydedildi:", jwt.substring(0, 10) + "...");
          set({ jwt });
        } catch (err) {
          console.error("Token kaydedilirken hata:", err);
        }
      },

      setUser: (userData: any) => {
        if (!userData) {
          console.warn("Kullanıcı verisi boş");
          set({ user: null, isAuthenticated: false });
          return;
        }

        // Backend'den gelen user verisini normalize et
        const formattedUser = {
          ...userData,
          id: userData._id || userData.id,
          rol: userData.role || userData.rol,
          username: userData.username || userData.name || "",
          email: userData.email || ""
        };

        // User bilgilerini güncelle
        set({ user: formattedUser, isAuthenticated: true });

        // User bilgilerini localStorage'a da kaydet
        try {
          localStorage.setItem('user', JSON.stringify(formattedUser));
        } catch (err) {
          console.error("Kullanıcı bilgileri kaydedilirken hata:", err);
        }
      },

      setIsAuthenticated: (isAuthenticated: boolean) => {
        set({ isAuthenticated });
      },

      setIsLoading: (isLoading: boolean) => set({ isLoading }),

      logout: () => {
        console.log("Oturum kapatılıyor");

        // Oturum verilerini temizle
        endSession();

        // Local storage ve cookie temizliği
        try {
          localStorage.removeItem("jwt");
          localStorage.removeItem("user");
          Cookies.remove('jwt', { path: '/' });
        } catch (err) {
          console.error("Oturum bilgileri silinirken hata:", err);
        }

        // State'i sıfırla
        set({ jwt: "", user: null, isAuthenticated: false });

        // Hata gösterimi sıfırla
        isErrorShown = false;
      },

      getJwt: () => {
        // Önce store'dan kontrol et
        const storeJwt = get().jwt;
        if (storeJwt && storeJwt.length > 10) {
          return storeJwt;
        }

        // Store'da yoksa localStorage veya cookie'den al
        try {
          // localStorage'dan kontrol et
          const localJwt = localStorage.getItem("jwt");
          if (localJwt && localJwt.length > 10) {
            // Store'a kaydet ve döndür
            set({ jwt: localJwt });
            return localJwt;
          }

          // Cookie'den kontrol et
          const cookieJwt = Cookies.get('jwt');
          if (cookieJwt && cookieJwt.length > 10) {
            // Store'a kaydet ve döndür
            set({ jwt: cookieJwt });
            return cookieJwt;
          }
        } catch (err) {
          console.error("Token alınırken hata:", err);
        }

        console.warn("getJwt: Geçerli token bulunamadı");
        return null;
      },

      checkAdminRole: () => {
        const { user } = get();
        return user?.role === "admin";
      },

      refreshUserData: async () => {
        const { getJwt } = get();
        const token = getJwt();

        // Token yoksa sessiz bir şekilde çık
        if (!token) {
          console.warn("refreshUserData: Token bulunamadı");
          get().logout();
          return null;
        }

        set({ isLoading: true });

        try {
          console.log("refreshUserData: API isteği yapılıyor");

          // API isteği yap - token'ı Bearer olarak gönder
          const response = await axios.get("http://localhost:5000/api/users/me", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });

          console.log("API yanıtı:", response.data);

          // Başarılı yanıt durumu
          if (response?.data?.success && response?.data?.user) {
            // User bilgilerini güncelle
            get().setUser(response.data.user);
            set({ isLoading: false, isAuthenticated: true });
            isErrorShown = false; // Başarılı istek, hata bayrağını sıfırla
            return response.data.user;
          } else {
            console.warn("API yanıtında beklenen user verisi bulunamadı:", response.data);
            throw new Error("Geçersiz API yanıtı");
          }
        } catch (error: any) {
          console.error("Kullanıcı verisi yenileme hatası:", error);

          // Hata detaylarını kaydet
          if (error.response) {
            console.error("Hata yanıtı:", {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data
            });
          }

          // 401 veya 403 hataları - token süresi dolmuş veya geçersiz
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn("Yetki hatası (401/403) - logout yapılıyor");
            get().logout();

            // Sadece bir kez hata göster
            if (!isErrorShown) {
              isErrorShown = true;
              toast.error("Oturum süreniz doldu, lütfen tekrar giriş yapın", {
                id: AUTH_TOAST_ID,
                duration: 4000
              });
            }
          }

          set({ isLoading: false });
          return null;
        }
      }
    }),
    {
      name: "auth-storage",
      // Sadece gerekli alanları sakla
      partialize: (state) => ({
        jwt: state.jwt,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

export default useAuthStore;

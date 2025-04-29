"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/app/hooks/useAuth";
import { toast } from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { refreshUserData, getJwt, checkAdminRole, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      try {
        setLoading(true);

        // Token kontrolü
        const token = getJwt();
        if (!token) {
          if (isMounted) {
            toast.error("Bu sayfaya erişmek için giriş yapmalısınız.");
            router.push("/auth/login");
          }
          return;
        }

        // Kullanıcı bilgilerini yenile
        const userData = await refreshUserData();

        // Component unmount olduysa işlemi durdur
        if (!isMounted) return;

        if (!userData) {
          toast.error("Kullanıcı bilgileri alınamadı.");
          router.push("/auth/login");
          return;
        }

        // Admin rolünü kontrol et
        if (userData.rol !== "admin") {
          toast.error("Bu sayfaya erişim yetkiniz bulunmamaktadır.");
          router.push("/");
          return;
        }

        // Yetkilendirme başarılı
        setAuthorized(true);
      } catch (error) {
        if (isMounted) {
          console.error("Yetkilendirme kontrolü sırasında hata:", error);
          toast.error("Yetkilendirme hatası oluştu.");
          router.push("/auth/login");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyAdmin();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Yetki kontrol ediliyor...</h2>
          <p className="text-muted-foreground">Lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}

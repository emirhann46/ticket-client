"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import useAuthStore from "@/app/hooks/useAuth";

export default function OrganizerApplicationPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Bu sayfaya erişmek için giriş yapmalısınız.");
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Zaten organizatör ise ana sayfaya yönlendir
  useEffect(() => {
    if (user?.role === "organizer") {
      toast.error("Zaten organizatör rolüne sahipsiniz.");
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    setIsSubmitting(true);

    try {
      // JWT token al
      const token = useAuthStore.getState().getJwt();

      if (!token) {
        throw new Error("Oturum bilgilerinize ulaşılamadı, lütfen tekrar giriş yapın.");
      }

      // API isteği gönder
      const response = await fetch("http://localhost:5000/api/organizer-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Başvuru gönderilirken bir hata oluştu.");
      }

      console.log("Organizatör başvurusu başarıyla gönderildi:", data);

      toast.success("Başvurunuz başarıyla gönderildi. İncelendikten sonra size bilgi verilecektir.");
      router.push("/");
    } catch (error: any) {
      console.error("Başvuru hatası:", error);
      toast.error(error.message || "Başvuru gönderilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Organizatör Başvurusu</h1>
      <p className="mb-6 text-muted-foreground">
        Organizatör olmak için lütfen aşağıdaki formu doldurun. Başvurunuz incelendikten sonra size bilgi verilecektir.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Başvuru Başlığı</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Konser Organizatörü Olmak İstiyorum"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Başvuru Açıklaması</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Neden organizatör olmak istediğinizi ve tecrübelerinizi anlatın..."
            rows={6}
            required
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
        </Button>
      </form>
    </div>
  );
}
"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useCart from "@/app/hooks/useCart";
import useAuthStore from "@/app/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import { X, ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, getTotalPrice, clearCart } = useCart();
  const { user } = useAuthStore();

  // Admin kullanıcısını sepet sayfasına erişimini engelle
  useEffect(() => {
    if (user?.role === "admin") {
      toast.error("Admin kullanıcılar sepet özelliğine erişemez");
      router.push("/");
    }
  }, [user, router]);

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    toast.success("Ürün sepetten kaldırıldı");
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Sepetinizde ürün bulunmamaktadır");
      return;
    }

    // Ödeme sayfasına yönlendir
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="text-center flex flex-col items-center justify-center space-y-6">
          <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-3xl font-bold">Sepetiniz Boş</h1>
          <p className="text-muted-foreground">Sepetinizde hiç ürün bulunmuyor.</p>
          <Link href="/events">
            <Button>Etkinliklere Göz At</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Sepetim</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item._id} className="p-4 flex flex-col sm:flex-row items-center">
                <div className="relative h-24 w-24 rounded overflow-hidden flex-shrink-0 mb-4 sm:mb-0">
                  <Image
                    src={item.event.image}
                    alt={item.event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 sm:ml-4 text-center sm:text-left">
                  <h3 className="font-semibold">{item.event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.event.date).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="font-medium mt-1">{formatPrice(item.event.price)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(item._id)}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sipariş Özeti</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Toplam ({items.length} ürün)</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Genel Toplam</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={handleCheckout}>
                Ödemeye Geç
              </Button>
              <Button variant="outline" className="w-full" onClick={() => clearCart()}>
                Sepeti Temizle
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.push("/events")}>
                Alışverişe Devam Et
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
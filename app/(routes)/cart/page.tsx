"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2, CreditCard, Calendar, Clock, MapPin } from "lucide-react";
import useCartStore from "@/app/hooks/useCart";
import { useRouter } from "next/navigation";
import useAuthStore from "@/app/hooks/useAuth";
import { toast } from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, getTotal, getServiceFee, getTotalWithFee } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hydration hatası önlemek için client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sepetten öğe kaldırma
  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast.success("Bilet sepetten kaldırıldı");
  };

  // Ödeme sayfasına yönlendirme
  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Ödeme yapabilmek için giriş yapmalısınız");
      router.push("/auth/login");
      return;
    }
    
    if (items.length === 0) {
      toast.error("Sepetinizde bilet bulunmamaktadır");
      return;
    }
    
    router.push("/checkout");
  };

  if (!isClient) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Sepetim</h1>
          <div className="text-center py-10">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Sepetim</h1>

        {items.length === 0 ? (
          <div className="bg-card p-8 rounded-lg border border-border shadow-sm text-center">
            <h2 className="text-xl font-medium mb-4 text-foreground">Sepetiniz boş</h2>
            <p className="text-muted-foreground mb-6">Sepetinizde hiç bilet bulunmamaktadır.</p>
            <Link href="/events">
              <Button>Etkinliklere Göz At</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold text-foreground">Biletlerim ({items.length})</h2>
                </div>

                {items.map((item) => (
                  <div key={item.id} className="p-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative w-full sm:w-32 h-24 rounded-md overflow-hidden">
                        <Image
                          src={item.eventImage}
                          alt={item.eventTitle}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link href={`/events/${item.eventId}`}>
                              <h3 className="font-medium text-foreground hover:text-primary">{item.eventTitle}</h3>
                            </Link>
                            <div className="flex flex-wrap items-center mt-1 text-sm text-muted-foreground gap-3">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{item.eventDate}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{item.eventTime}</span>
                              </div>
                            </div>
                            <div className="flex items-center mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{item.eventLocation}</span>
                            </div>
                            <div className="mt-2 text-sm font-medium">
                              <span>Bilet Tipi: {item.ticketType}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">Bileti kaldır</span>
                          </Button>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div className="font-medium text-foreground">
                            Fiyat: {item.price}₺
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Miktar: 1 Bilet
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm sticky top-24">
                <h2 className="text-xl font-bold mb-6 text-foreground">Sipariş Özeti</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Ara Toplam</span>
                    <span>{getTotal()}₺</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Hizmet Bedeli</span>
                    <span>{getServiceFee()}₺</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between font-medium text-foreground">
                    <span>Toplam</span>
                    <span>{getTotalWithFee()}₺</span>
                  </div>
                </div>

                <Button 
                  className="w-full mb-4" 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isProcessing ? "İşleniyor..." : "Ödemeye Geç"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ödemeye geçerek, <Link href="/terms" className="text-primary hover:underline">Kullanım Şartları</Link> ve <Link href="/privacy" className="text-primary hover:underline">Gizlilik Politikası</Link>'nı kabul etmiş olursunuz.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
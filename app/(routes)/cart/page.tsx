"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, CreditCard, Calendar, Clock } from "lucide-react";
import axios from "axios";
import useAuthStore from "@/app/hooks/useAuth";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  status: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, getJwt } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    if (!isAuthenticated) {
      toast.error("Sepeti görüntülemek için giriş yapmalısınız");
      router.push('/auth/login');
      return;
    }

    fetchCartItems();
  }, [isAuthenticated, router]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = getJwt();

      // Sepetteki biletleri getir (cart statusunda olanlar)
      const response = await axios.get('http://localhost:5000/api/tickets?status=cart', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.data) {
        setCartItems(response.data.data);
      }
    } catch (error) {
      console.error("Sepet bilgileri yüklenirken hata:", error);
      toast.error("Sepet bilgileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const token = getJwt();

      // Bileti sepetten kaldır
      await axios.delete(`http://localhost:5000/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCartItems(cartItems.filter(item => item._id !== id));
      toast.success("Bilet sepetten kaldırıldı");
    } catch (error) {
      console.error("Bilet kaldırılırken hata:", error);
      toast.error("Bilet kaldırılamadı");
    }
  };

  const handleQuantityChange = async (id: string, change: number) => {
    const item = cartItems.find(item => item._id === id);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + change);

    if (newQuantity === item.quantity) return;

    try {
      const token = getJwt();

      // Bilet miktarını güncelle
      await axios.put(`http://localhost:5000/api/tickets/${id}/quantity`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCartItems(cartItems.map(item => {
        if (item._id === id) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      }));
    } catch (error) {
      console.error("Bilet miktarı güncellenirken hata:", error);
      toast.error("Bilet miktarı güncellenemedi");
    }
  };

  const handleCheckout = async () => {
    try {
      const token = getJwt();

      // Ödeme işlemini başlat
      const response = await axios.post('http://localhost:5000/api/tickets/checkout',
        { items: cartItems.map(item => item._id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Ödeme başarıyla tamamlandı!");

      // Biletler sayfasına yönlendir
      router.push('/tickets');
    } catch (error: any) {
      console.error("Ödeme işlemi sırasında hata:", error);
      toast.error(error.response?.data?.message || "Ödeme işlemi sırasında bir hata oluştu");
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.event.price * item.quantity), 0);
  };

  const calculateServiceFee = () => {
    return Math.round(calculateSubtotal() * 0.05); // %5 hizmet bedeli
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateServiceFee();
  };

  // Tarih formatlayıcı fonksiyon
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Varsayılan resim
  const defaultImageUrl = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80";

  if (loading) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Sepetim</h1>
          <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="text-center mt-4 text-muted-foreground">Sepet bilgileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Sepetim</h1>

        {cartItems.length === 0 ? (
          <div className="bg-card p-8 rounded-lg border border-border shadow-sm text-center">
            <h2 className="text-xl font-medium mb-4 text-foreground">Sepetiniz boş</h2>
            <p className="text-muted-foreground mb-6">Sepetinizde hiç ürün bulunmamaktadır.</p>
            <Link href="/events">
              <Button>Etkinliklere Göz At</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold text-foreground">Sepet Öğeleri ({cartItems.length})</h2>
                </div>

                {cartItems.map((item) => (
                  <div key={item._id} className="p-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative w-full sm:w-32 h-24 rounded-md overflow-hidden">
                        <Image
                          src={item.event.image || defaultImageUrl}
                          alt={item.event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <Link href={`/events/${item.event._id}`}>
                            <h3 className="font-medium text-foreground hover:text-primary">{item.event.title}</h3>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item._id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="mr-3">{formatDate(item.event.date)}</span>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item._id, -1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item._id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="font-medium text-foreground">
                            {item.event.price}₺ x {item.quantity} = {item.event.price * item.quantity}₺
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
                    <span>{calculateSubtotal()}₺</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Hizmet Bedeli</span>
                    <span>{calculateServiceFee()}₺</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between font-medium text-foreground">
                    <span>Toplam</span>
                    <span>{calculateTotal()}₺</span>
                  </div>
                </div>

                <Button className="w-full mb-4" onClick={handleCheckout}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ödemeye Geç
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
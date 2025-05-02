"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Download, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import useAuthStore from "@/app/hooks/useAuth";
import useCartStore from "@/app/hooks/useCart";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";

interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketType: string;
  ticketCode: string;
  price: number;
  purchaseDate: string;
  status: "active" | "used" | "expired";
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "used" | "expired">("all");
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user, getJwt } = useAuthStore();
  const { addItem, items } = useCartStore(); // Sepet hook'undan addItem fonksiyonunu alıyoruz
  const router = useRouter();
  
  // Kullanıcı rolü bilgisini almak için
  const userRole = user?.rol;

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Biletlerinizi görüntülemek için giriş yapmalısınız");
      router.push("/auth/login");
      return;
    }

    fetchTickets();
  }, [isAuthenticated, router]);

  // Bilet verilerini API'den çek
  const fetchTickets = async () => {
    setIsLoading(true);
    
    try {
      // Gerçek API entegrasyonunda aşağıdaki gibi bir yapı kullanılacak
      // const token = getJwt();
      // const response = await axios.get("http://localhost:1337/api/tickets/user", {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setTickets(response.data);
      
      // Şimdilik örnek veri kullanıyoruz
      setTimeout(() => {
        setTickets([
          {
            id: "1",
            eventId: "1",
            eventTitle: "Duman Konseri",
            eventImage: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            eventDate: "15 Aralık 2023",
            eventTime: "20:00",
            eventLocation: "Volkswagen Arena, İstanbul",
            ticketType: "VIP",
            ticketCode: "DUMAN-VIP-12345",
            price: 1500,
            purchaseDate: "1 Kasım 2023",
            status: "active"
          },
          {
            id: "2",
            eventId: "2",
            eventTitle: "Tech Summit 2025",
            eventImage: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1112&q=80",
            eventDate: "10 Nisan 2025",
            eventTime: "09:00",
            eventLocation: "İstanbul Kongre Merkezi",
            ticketType: "Tam Gün",
            ticketCode: "TECH-FULL-67890",
            price: 250,
            purchaseDate: "15 Şubat 2025",
            status: "active"
          },
          {
            id: "3",
            eventId: "3",
            eventTitle: "İstanbul Coffee Festival",
            eventImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            eventDate: "10 Ekim 2023",
            eventTime: "12:00",
            eventLocation: "KüçükÇiftlik Park, İstanbul",
            ticketType: "Standart",
            ticketCode: "COFFEE-STD-54321",
            price: 150,
            purchaseDate: "1 Ekim 2023",
            status: "used"
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Biletler alınırken hata oluştu:", error);
      toast.error("Biletleriniz yüklenirken bir sorun oluştu");
      setIsLoading(false);
    }
  };

  // Sepete bilet ekleme fonksiyonu
  const handleAddToCart = (ticket: Ticket) => {
    const cartItem = {
      id: ticket.id,
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      eventImage: ticket.eventImage,
      eventDate: ticket.eventDate,
      eventTime: ticket.eventTime,
      eventLocation: ticket.eventLocation,
      ticketType: ticket.ticketType,
      price: ticket.price,
      quantity: 1
    };
    
    addItem(cartItem);
    toast.success(`"${ticket.eventTitle}" sepete eklendi`);
  };

  // Sepeti satın alma ve konsola yazdırma
  const handlePurchase = () => {
    if (items.length === 0) {
      toast.error("Sepetinizde ürün bulunmamaktadır");
      return;
    }
    
    console.log("Sepetteki ürünler:", items);
    toast.success("Ürünler satın alındı! (Sepet içeriği konsola yazdırıldı)");
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeFilter === "all") return true;
    return ticket.status === activeFilter;
  });

  const handleDownload = (ticketId: string) => {
    // Bilet indirme fonksiyonu
    toast.success(`Bilet ${ticketId} indirilecek`);
  };

  const handleShare = (ticketId: string) => {
    // Bilet paylaşım fonksiyonu
    toast.success(`Bilet ${ticketId} paylaşılacak`);
  };

  const getStatusBadgeClass = (status: Ticket["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "used":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
    }
  };

  const getStatusText = (status: Ticket["status"]) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "used":
        return "Kullanıldı";
      case "expired":
        return "Süresi Doldu";
      default:
        return status;
    }
  };

  // Admin rolü için ayrı bir görünüm sunabiliriz
  if (userRole === "admin") {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Sistem Biletleri</h1>
          <p className="text-muted-foreground mb-8">Admin panelinden tüm biletleri yönetebilirsiniz</p>
          
          <div className="bg-card p-8 rounded-lg border border-border shadow-sm">
            <p>Lütfen Admin panelinden bilet yönetimine gidin</p>
            <Button className="mt-4" onClick={() => router.push("/admin/tickets")}>
              Admin Paneline Git
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Biletlerim</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Biletlerim</h1>
        
        {/* Sepeti satın al butonu */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              onClick={() => setActiveFilter("all")}
            >
              Tümü
            </Button>
            <Button
              variant={activeFilter === "active" ? "default" : "outline"}
              onClick={() => setActiveFilter("active")}
            >
              Aktif
            </Button>
            <Button
              variant={activeFilter === "used" ? "default" : "outline"}
              onClick={() => setActiveFilter("used")}
            >
              Kullanıldı
            </Button>
            <Button
              variant={activeFilter === "expired" ? "default" : "outline"}
              onClick={() => setActiveFilter("expired")}
            >
              Süresi Doldu
            </Button>
          </div>
          
          <Button
            variant="default"
            onClick={handlePurchase}
            className="bg-green-600 hover:bg-green-700"
          >
            Sepeti Satın Al
          </Button>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="bg-card p-8 rounded-lg border border-border shadow-sm text-center">
            <h2 className="text-xl font-medium mb-4 text-foreground">Biletin Yok</h2>
            <p className="text-muted-foreground mb-6">
              {activeFilter === "all" 
                ? "Henüz hiç bilet satın almadınız."
                : "Seçtiğiniz filtreye uygun bilet bulunamadı."
              }
            </p>
            <Link href="/events">
              <Button>Etkinliklere Göz At</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4">
                  <div className="md:col-span-3">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(ticket.status)}`}>
                            {getStatusText(ticket.status)}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {ticket.ticketCode}
                          </span>
                        </div>
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleDownload(ticket.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            İndir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleShare(ticket.id)}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Paylaş
                          </Button>
                          {ticket.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90"
                              onClick={() => handleAddToCart(ticket)}
                            >
                              Sepete Ekle
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative w-full md:w-40 h-32">
                          <Image
                            src={ticket.eventImage}
                            alt={ticket.eventTitle}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-foreground">
                            {ticket.eventTitle}
                          </h2>
                          <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              {ticket.eventDate}
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              {ticket.eventTime}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4" />
                              {ticket.eventLocation}
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="text-sm text-muted-foreground">
                              <span>Bilet Tipi: <span className="font-medium text-foreground">{ticket.ticketType}</span></span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>Bilet Kodu: <span className="font-medium text-foreground">{ticket.ticketCode}</span></span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>Satın Alma Tarihi: <span className="font-medium text-foreground">{ticket.purchaseDate}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {ticket.status === "active" ? (
                    <div className="md:border-l border-border p-6 flex flex-col items-center justify-center">
                      <div className="bg-white p-2 rounded-lg mb-4 w-32 h-32 flex items-center justify-center">
                        <QRCodeSVG 
                          value={ticket.ticketCode} 
                          size={112} 
                          bgColor={"#ffffff"} 
                          fgColor={"#000000"} 
                          level={"H"} 
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Kare kodu giriş kapısında okutunuz
                      </p>
                    </div>
                  ) : (
                    <div className="md:border-l border-border p-6 flex flex-col items-center justify-center">
                      <div className="p-2 rounded-lg mb-4 w-32 h-32 flex items-center justify-center opacity-30 bg-muted">
                        <QRCodeSVG 
                          value={ticket.ticketCode} 
                          size={112} 
                          bgColor={"#f5f5f5"} 
                          fgColor={"#a1a1a1"} 
                          level={"H"} 
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        {ticket.status === "used" ? "Bu bilet kullanılmıştır" : "Bu biletin süresi dolmuştur"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
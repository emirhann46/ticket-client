"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Download, Share2, Ticket, Tag, CheckCircle, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import useAuthStore from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";

// MongoDB ticket modeline uygun interface
interface Ticket {
  _id: string;
  eventId: {
    _id: string;
    title: string;
    location: string;
    date: string;
    coverImage?: string;
    image?: string;
  };
  userId: string;
  purchaseDate: string;
  price: number;
  isPaid: boolean;
  qrCode: string;
  isUsed: boolean;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export default function TicketsPage() {
  const router = useRouter();
  const { user, isAuthenticated, jwt, getJwt } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Client tarafında çalıştığından emin ol
  useEffect(() => {
    setIsClient(true);
  }, []);



  // Kullanıcı giriş yapmamışsa veya admin rolündeyse yönlendirme yap
  useEffect(() => {
    if (!isClient) return;

    if (!isAuthenticated) {
      toast.error("Biletlerinizi görüntülemek için giriş yapmalısınız");
      router.push("/auth/login?returnUrl=/tickets");
      return;
    }

    // Admin rolünü kontrol et - admin ise ana sayfaya yönlendir
    if (user?.role === "admin") {
      toast.error("Admin kullanıcılar bilet sayfasına erişemez");
      router.push("/");
      return;
    }

    // Kullanıcı giriş yapmış ve admin değilse biletleri getir
    if (user?._id) {
      fetchUserTickets();
    }
  }, [isClient, isAuthenticated, user]);

  // Kullanıcının biletlerini getir
  const fetchUserTickets = async () => {
    try {
      setIsLoading(true);
      console.log("Biletler getiriliyor...");

      // Doğrudan useAuthStore'dan token al - bu daha güvenilir
      const token = getJwt();
      console.log("JWT Token mevcut mu:", !!token);

      if (!token) {
        console.error("JWT token bulunamadı! Biletler getirilemeyecek.");
        toast.error("Oturum bilgilerinize erişilemedi. Lütfen tekrar giriş yapın.");
        return;
      }

      // MongoDB API'sine istek at
      const response = await axios.get(`http://localhost:5000/api/tickets/my-tickets`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("API yanıtı:", response.data.data);

      if (response.data && response.data.success) {
        // Biletleri başarılı yanıttan al
        const allTickets = response.data.data || [];
        console.log(`Toplam ${allTickets.length} bilet bulundu`);

        if (allTickets.length === 0) {
          console.log("Hiç bilet bulunamadı!");
          // State'i güncelliyoruz ama bilet olmadığını göstereceğiz
          setTickets([]);
          setIsLoading(false);
          return;
        }

        // Verilerin doğru geldiğinden emin olmak için eventId kontrolü
        const validTickets = allTickets.filter(ticket => {
          // Geçersiz eventId olan biletleri filtrele (eventId undefined veya null ise)
          if (!ticket.eventId) {
            console.warn(`Bilet ID: ${ticket._id} için eventId eksik veya geçersiz!`);
            return false;
          }
          return true;
        });

        console.log(`Geçerli bilet sayısı: ${validTickets.length}`);

        // Biletleri state'e yükle
        setTickets(validTickets);
      } else {
        console.error("API başarısız yanıt döndü:", response.data);
        toast.error("Bilet verileri alınamadı");
      }
    } catch (error: any) {
      console.error("Biletler yüklenirken hata:", error);
      console.error("Hata detayı:", error.response?.data || error.message);
      toast.error("Biletler yüklenemedi: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    
    fetchUserTickets()
   
  }, []);
  

  // Kullanıcı rolünü al
  const userRole = user?.role;

  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "used" | "pending" | "confirmed" | "cancelled">("all");

  const filteredTickets = tickets.filter(ticket => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return !ticket.isUsed;
    if (activeFilter === "used") return ticket.isUsed;
    if (activeFilter === "pending" || activeFilter === "confirmed" || activeFilter === "cancelled") {
      return ticket.status === activeFilter;
    }
    return true;
  });

  const handleDownload = (ticket: Ticket) => {
    // Bilet indirme fonksiyonu
    toast.success(`Bilet indirme başlatılıyor...`);
    // Gerçek uygulamada PDF indirme işlevi burada olacak
  };

  const handleShare = (ticket: Ticket) => {
    // Bilet paylaşım fonksiyonu
    if (navigator.share) {
      navigator.share({
        title: `${ticket.eventId.title} Bileti`,
        text: `${ticket.eventId.title} etkinliği için biletim.`,
        url: window.location.href
      })
        .then(() => toast.success('Bilet paylaşıldı'))
        .catch((error) => console.error('Paylaşım sırasında hata:', error));
    } else {
      // Mobil desteği olmayan tarayıcılar için alternatif paylaşım
      navigator.clipboard.writeText(`${window.location.origin}/tickets/${ticket._id}`);
      toast.success('Bilet bağlantısı panoya kopyalandı!');
    }
  };

  // Tarih formatlama fonksiyonu
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Durum çevirme fonksiyonu
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'confirmed': return 'Onaylandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  // Durum renk sınıfını alma fonksiyonu
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
    }
  };

  // Etkinlik resmini belirleyen yardımcı fonksiyon
  const getEventImage = (event: any) => {
    if (!event) return defaultImageUrl;

    if (event.coverImage) return event.coverImage;
    if (event.image) return event.image;

    return defaultImageUrl;
  };

  // Varsayılan resim
  const defaultImageUrl = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80";

  if (!isClient || isLoading) {
    return (
      <div className="bg-background min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-foreground">Biletlerim</h1>
          <div className="animate-pulse space-y-4 md:space-y-6">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden h-48 md:h-64">
                <div className="h-full bg-muted"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8 md:py-12">
      {userRole === "admin" ? (
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">Admin Paneli</h1>
          <p className="mb-4 text-muted-foreground">Admin olarak tüm biletleri yönetebilirsiniz.</p>
          <Button onClick={() => router.push('/admin')} className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Admin Paneline Git
          </Button>
        </div>
      ) : (
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-foreground">Biletlerim</h1>

          {/* Filtre Butonları */}
          <div className="mb-6 md:mb-8 flex flex-wrap gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              onClick={() => setActiveFilter("all")}
              className="text-sm px-3 md:text-base"
            >
              Tümü ({tickets.length})
            </Button>
            <Button
              variant={activeFilter === "active" ? "default" : "outline"}
              onClick={() => setActiveFilter("active")}
              className="text-sm px-3 md:text-base"
            >
              Aktif ({tickets.filter(t => !t.isUsed).length})
            </Button>
            <Button
              variant={activeFilter === "used" ? "default" : "outline"}
              onClick={() => setActiveFilter("used")}
              className="text-sm px-3 md:text-base"
            >
              Kullanıldı ({tickets.filter(t => t.isUsed).length})
            </Button>
            <Button
              variant={activeFilter === "confirmed" ? "default" : "outline"}
              onClick={() => setActiveFilter("confirmed")}
              className="text-sm px-3 md:text-base"
            >
              Onaylı ({tickets.filter(t => t.status === "confirmed").length})
            </Button>
            <Button
              variant={activeFilter === "pending" ? "default" : "outline"}
              onClick={() => setActiveFilter("pending")}
              className="text-sm px-3 md:text-base"
            >
              Beklemede ({tickets.filter(t => t.status === "pending").length})
            </Button>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="bg-card p-6 md:p-8 rounded-lg border border-border shadow-sm text-center">
              <div className="flex justify-center mb-4">
                <Ticket className="h-16 w-16 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-medium mb-3 text-foreground">Bilet bulunamadı</h2>
              <p className="text-muted-foreground mb-6">Seçilen filtreye uygun bilet bulunmamaktadır.</p>
              <Link href="/events">
                <Button>Etkinliklere Göz At</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-card rounded-lg border border-border shadow-sm overflow-hidden hover:border-primary transition-all duration-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="relative h-40 md:h-auto">
                      <Image
                        src={getEventImage(ticket.eventId)}
                        alt={ticket.eventId?.title || "Etkinlik"}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {/* Kullanım Durumu */}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ticket.isUsed
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {ticket.isUsed ? "Kullanıldı" : "Aktif"}
                        </span>

                        {/* Ödeme/Onay Durumu */}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 md:p-6 md:col-span-2">
                      <div className="flex flex-col md:flex-row md:justify-between md:gap-6">
                        <div className="flex-1">
                          <Link href={`/events/${ticket.eventId._id}`}>
                            <h2 className="text-lg md:text-xl font-bold text-foreground hover:text-primary mb-2">
                              {ticket.eventId?.title || "Bilinmeyen Etkinlik"}
                            </h2>
                          </Link>

                          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">
                                {ticket.eventId?.date ? formatDate(ticket.eventId.date) : "Tarih belirtilmemiş"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">
                                {ticket.eventId?.location || "Konum belirtilmemiş"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{ticket.price} ₺</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>Satın Alma: {formatDate(ticket.purchaseDate)}</span>
                            </div>
                            {ticket.status === "confirmed" && ticket.isPaid ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>Ödeme onaylandı</span>
                              </div>
                            ) : ticket.status === "cancelled" ? (
                              <div className="flex items-center text-red-600">
                                <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>İptal edildi</span>
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-4 text-xs md:text-sm">
                            {ticket.qrCode && (
                              <div>
                                <span className="block font-medium text-foreground">Bilet Kodu</span>
                                <span className="tracking-wide font-mono">{ticket.qrCode}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 md:mt-0 flex md:flex-col items-center md:items-center justify-center md:justify-start md:min-w-[140px]">
                          {/* Onaylanmış bilet QR kodu */}
                          {!ticket.isUsed && ticket.status === "confirmed" && ticket.isPaid ? (
                            <>
                              <div className="bg-amber-100 p-2 rounded-lg mb-0 md:mb-4 mr-4 md:mr-0 w-24 h-24 flex items-center justify-center">
                                <QRCodeSVG value={ticket.qrCode || ticket._id} className="h-20 w-20" />
                              </div>
                              <div className="flex md:flex-col gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(ticket)}
                                  className="w-full text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  İndir
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShare(ticket)}
                                  className="w-full text-xs"
                                >
                                  <Share2 className="h-3 w-3 mr-1" />
                                  Paylaş
                                </Button>
                              </div>
                            </>
                          ) : ticket.status === "pending" ? (
                            <div className="flex flex-col items-center justify-center bg-amber-50 rounded-lg p-4 w-full h-full">
                              <Clock className="h-6 w-6 text-amber-600 mb-2" />
                              <p className="text-amber-600 text-sm font-medium text-center">Onay Bekleniyor</p>
                              <p className="text-amber-500 text-xs text-center mt-1">Ödemeniz doğrulandıktan sonra bilet aktif olacak</p>
                            </div>
                          ) : ticket.status === "cancelled" ? (
                            <div className="flex flex-col items-center justify-center bg-red-50 rounded-lg p-4 w-full h-full">
                              <XCircle className="h-6 w-6 text-red-500 mb-2" />
                              <p className="text-red-600 text-sm font-medium text-center">Bilet İptal Edildi</p>
                            </div>
                          ) : ticket.isUsed ? (
                            <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg p-4 w-full h-full">
                              <CheckCircle className="h-6 w-6 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground text-sm text-center">Bilet Kullanıldı</p>
                              <p className="text-muted-foreground/70 text-xs text-center mt-1">
                                {formatDate(ticket.purchaseDate)}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
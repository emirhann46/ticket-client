"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Download, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import useAuthStore from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";

interface Ticket {
  id: number;
  attributes: {
    fiyat: number;
    kullanildi: boolean;
    kod: string;
    createdAt: string;
    event: {
      data: {
        id: number;
        attributes: {
          baslik: string;
          lokasyon: string;
          tarih: string;
          kapakFoto: {
            data: {
              attributes: {
                url: string;
              };
            };
          } | null;
        };
      };
    };
  };
}

export default function TicketsPage() {
  const router = useRouter();
  const { user, isAuthenticated, jwt } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Client tarafında çalıştığından emin ol
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (isClient && !isAuthenticated) {
      toast.error("Biletlerinizi görüntülemek için giriş yapmalısınız.");
      router.push("/auth/login");
      return;
    }

    // Kullanıcı giriş yapmışsa biletleri getir
    if (isClient && isAuthenticated && user?.id) {
      fetchUserTickets();
    }
  }, [isClient, isAuthenticated, router, user?.id]);

  // Kullanıcının biletlerini getir
  const fetchUserTickets = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:1337/api/tickets`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        params: {
          'filters[user][id][$eq]': user?.id,
          'populate': 'event.kapakFoto'
        }
      });

      if (response.data && response.data.data) {
        setTickets(response.data.data);
      }
    } catch (error) {
      console.error("Biletler yüklenirken hata:", error);
      toast.error("Biletler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  // Kullanıcı rolünü al
  const userRole = user?.rol;

  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "used">("all");

  const filteredTickets = tickets.filter(ticket => {
    if (activeFilter === "all") return true;
    return activeFilter === "used" ? ticket.attributes.kullanildi : !ticket.attributes.kullanildi;
  });

  const handleDownload = (ticketId: number) => {
    // Bilet indirme fonksiyonu
    toast.success(`Bilet indirme başlatılıyor...`);
    // Gerçek uygulamada PDF indirme işlevi burada olacak
  };

  const handleShare = (ticketId: number) => {
    // Bilet paylaşım fonksiyonu
    if (navigator.share) {
      navigator.share({
        title: 'Biletim',
        text: 'Biletle ilgili detaylar',
        url: window.location.href
      })
        .then(() => toast.success('Bilet paylaşıldı'))
        .catch((error) => console.error('Paylaşım sırasında hata:', error));
    } else {
      toast.error('Paylaşım özelliği bu tarayıcıda desteklenmiyor');
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

  // Varsayılan resim
  const defaultImageUrl = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80";

  if (!isClient || isLoading) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Biletlerim</h1>
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden h-64">
                <div className="h-full bg-muted"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12">
      {
        userRole === "admin" ? (
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-8 text-foreground">Admin Paneli</h1>
            <p className="mb-4">Admin olarak tüm biletleri yönetebilirsiniz.</p>
            <Button onClick={() => router.push('/admin')}>
              Admin Paneline Git
            </Button>
          </div>
        ) : (
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-8 text-foreground">Biletlerim</h1>

            <div className="mb-8 flex flex-wrap gap-2">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
              >
                Tümü ({tickets.length})
              </Button>
              <Button
                variant={activeFilter === "active" ? "default" : "outline"}
                onClick={() => setActiveFilter("active")}
              >
                Aktif ({tickets.filter(t => !t.attributes.kullanildi).length})
              </Button>
              <Button
                variant={activeFilter === "used" ? "default" : "outline"}
                onClick={() => setActiveFilter("used")}
              >
                Kullanıldı ({tickets.filter(t => t.attributes.kullanildi).length})
              </Button>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="bg-card p-8 rounded-lg border border-border shadow-sm text-center">
                <h2 className="text-xl font-medium mb-4 text-foreground">Bilet bulunamadı</h2>
                <p className="text-muted-foreground mb-6">Seçilen filtreye uygun bilet bulunmamaktadır.</p>
                <Link href="/events">
                  <Button>Etkinliklere Göz At</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      <div className="relative h-48 md:h-auto">
                        <Image
                          src={
                            ticket.attributes.event?.data?.attributes.kapakFoto?.data?.attributes.url
                              ? `http://localhost:1337${ticket.attributes.event.data.attributes.kapakFoto.data.attributes.url}`
                              : defaultImageUrl
                          }
                          alt={ticket.attributes.event?.data?.attributes.baslik || "Etkinlik"}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 right-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.attributes.kullanildi
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"}`}
                          >
                            {ticket.attributes.kullanildi ? "Kullanıldı" : "Aktif"}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 md:col-span-2">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <Link href={`/events/${ticket.attributes.event?.data?.id}`}>
                              <h2 className="text-xl font-bold text-foreground hover:text-primary">
                                {ticket.attributes.event?.data?.attributes.baslik || "Bilinmeyen Etkinlik"}
                              </h2>
                            </Link>

                            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{ticket.attributes.event?.data?.attributes.tarih
                                  ? formatDate(ticket.attributes.event.data.attributes.tarih)
                                  : "Tarih belirtilmemiş"}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{ticket.attributes.event?.data?.attributes.lokasyon || "Konum belirtilmemiş"}</span>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="text-sm text-muted-foreground">
                                <span>Bilet Kodu: <span className="font-medium text-foreground">{ticket.attributes.kod}</span></span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span>Fiyat: <span className="font-medium text-foreground">{ticket.attributes.fiyat} ₺</span></span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span>Satın Alma Tarihi: <span className="font-medium text-foreground">
                                  {formatDate(ticket.attributes.createdAt)}
                                </span></span>
                              </div>
                            </div>
                          </div>

                          {!ticket.attributes.kullanildi ? (
                            <div className="mt-6 md:mt-0 flex flex-col items-center justify-center">
                              <div className="p-2 rounded-lg mb-4 w-32 h-32 flex items-center justify-center bg-amber-400">
                                <QRCodeSVG value={ticket.attributes.kod} className="h-24 w-24 text-foreground" />
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(ticket.id)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  İndir
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShare(ticket.id)}
                                >
                                  <Share2 className="h-4 w-4 mr-1" />
                                  Paylaş
                                </Button>
                              </div>
                            </div>
                          ) :
                            <div className="mt-6 md:mt-0 flex flex-col items-center justify-center">
                              <p className="text-muted-foreground mb-6">Bilet kullanıldı</p>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }
    </div>
  );
}
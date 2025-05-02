"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Share2, Heart, Users } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAuthStore from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import useCart from "@/app/hooks/useCart";

interface EventPageProps {
  params: {
    id: string;
  };
}

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  price: number;
  coverImage: string;
  sliderImages: string[];
  category: {
    _id: string;
    name: string;
  };
  organizerId: {
    _id: string;
    username: string;
    email: string;
  };
  availableTickets: number;
}

export default function EventPage({ params }: { params: Promise<EventPageProps["params"]> }) {
  const { id: eventId } = use(params);
  const [isLiked, setIsLiked] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarEvents, setSimilarEvents] = useState([]);
  const { isAuthenticated, user, getJwt } = useAuthStore();
  const { addItem, items } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/events/${eventId}`);

        if (response.data && response.data.data) {
          setEvent(response.data.data);
        }
      } catch (error) {
        console.error("Etkinlik detayları yüklenirken hata:", error);
        toast.error("Etkinlik detayları yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarEvents = async () => {
      try {
        // Benzer etkinlikleri getir (aynı kategorideki diğer etkinlikler olabilir)
        const response = await axios.get(`http://localhost:5000/api/events?limit=3`);

        if (response.data && response.data.data) {
          setSimilarEvents(response.data.data.filter((e: any) => e._id !== eventId).slice(0, 3));
        }
      } catch (error) {
        console.error("Benzer etkinlikler yüklenirken hata:", error);
      }
    };

    fetchEventDetails();
    fetchSimilarEvents();
  }, [eventId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // Bu işlevsellik sonraki aşamalarda implement edilebilir
    toast.success(isLiked ? "Etkinlik favorilerden çıkarıldı" : "Etkinlik favorilere eklendi");
  };

  const handleShare = () => {
    // Paylaşım fonksiyonu
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'Etkinlik',
        text: event?.description || '',
        url: window.location.href,
      })
        .catch(err => console.error('Paylaşım hatası:', err));
    } else {
      toast.success("Etkinlik bağlantısı panoya kopyalandı!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Sepete ekle
  const handleAddToCart = () => {
    if (!event) return;
    if (!isAuthenticated) {
      toast.error("Bilet almak için giriş yapmalısınız");
      router.push('/auth/login');
      return;
    }

    // Admin kullanıcıları sepete ekleme yapamaz
    if (user?.role === 'admin') {
      toast.error("Admin kullanıcılar sepete ürün ekleyemez");
      return;
    }

    // Ürün zaten sepette mi kontrol et
    const isInCart = items.some(item => item.event._id === event._id);
    if (isInCart) {
      toast.error("Bu etkinlik zaten sepetinizde");
      return;
    }

    addItem({
      _id: event._id,
      event: {
        _id: event._id,
        title: event.title,
        image: event.coverImage,
        date: event.date,
        price: event.price,
      },
      quantity: 1,
    });

    toast.success("Etkinlik sepete eklendi!");
  };

  const handleBuyTicket = async () => {
    handleAddToCart();
    router.push('/cart');
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

  if (loading) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-muted animate-pulse"></div>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm flex flex-col animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-muted rounded w-1/2 mb-3"></div>
              <div className="h-6 bg-muted rounded w-2/3 mb-3"></div>
              <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
              <div className="mt-auto">
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Etkinlik bulunamadı</h1>
          <p className="mb-6">Bu etkinlik artık mevcut değil veya kaldırılmış olabilir.</p>
          <Button asChild><Link href="/events">Tüm Etkinlikler</Link></Button>
        </div>
      </div>
    );
  }

  // Ürünün sepette olup olmadığını kontrol et
  const isInCart = items.some(item => item.event._id === event._id);

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Etkinlik Başlık ve Resim */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm flex flex-col">
            <h1 className="text-2xl font-bold mb-4 text-foreground">{event.title}</h1>

            <div className="flex items-center mb-3 text-muted-foreground">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{formatDate(event.date)}</span>
            </div>

            <div className="flex items-center mb-3 text-muted-foreground">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{event.location}</span>
            </div>

            <div className="flex items-center mb-3 text-muted-foreground">
              <Users className="h-5 w-5 mr-2" />
              <span>Organizatör: {event.organizerId?.username || "Bilinmiyor"}</span>
            </div>

            <div className="mt-2 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {event.category?.name || "Genel"}
              </span>
            </div>

            <div className="mt-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="text-foreground">
                  <span className="text-sm">Bilet Fiyatı</span>
                  <p className="text-xl font-bold">{formatPrice(event.price)}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLike}
                    className={isLiked ? "text-red-500" : ""}
                  >
                    <Heart className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleBuyTicket}
                disabled={event.availableTickets <= 0 || user?.role === "admin" || isInCart}
              >
                {event.availableTickets <= 0
                  ? "Biletler Tükendi"
                  : isInCart
                    ? "Sepete Eklendi"
                    : "Bilet Al"}
              </Button>
            </div>
          </div>
        </div>

        {/* Etkinlik Detayları ve Bilet Seçenekleri */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm mb-8">
              <h2 className="text-xl font-bold mb-4 text-foreground">Etkinlik Detayları</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-foreground">Konum</h2>
              <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-muted">
                {/* Burada gerçek bir harita komponenti olacak */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">Harita yükleniyor...</p>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">{event.location}</p>
            </div>
          </div>

          <div>
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm sticky top-24">
              <h2 className="text-xl font-bold mb-4 text-foreground">Bilet Bilgisi</h2>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-foreground">Standart Bilet</h3>
                  <span className="font-bold text-foreground">{formatPrice(event.price)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-muted-foreground">
                    {event.availableTickets} adet kaldı
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={event.availableTickets <= 0 || user?.role === "admin" || isInCart}
                >
                  {event.availableTickets <= 0
                    ? "Biletler Tükendi"
                    : isInCart
                      ? "Sepete Eklendi"
                      : "Sepete Ekle"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Benzer Etkinlikler */}
        {similarEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Benzer Etkinlikler</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarEvents.map((relatedEvent: any) => (
                <Link href={`/events/${relatedEvent._id}`} key={relatedEvent._id}>
                  <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative w-full h-48">
                      <Image
                        src={relatedEvent.coverImage}
                        alt={relatedEvent.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-foreground">{relatedEvent.title}</h3>
                      <p className="text-sm text-muted-foreground">{formatDate(relatedEvent.date)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
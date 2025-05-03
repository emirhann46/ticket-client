"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ShoppingCart, Check } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import useCart from "@/app/hooks/useCart";
import { Event } from "@/app/constans/type"; // Tipi constans/type.ts'den alalım

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const { addToCart, isInCart } = useCart();
  const [isClient, setIsClient] = useState(false);

  // URL'den filtre parametrelerini al
  const categoryId = searchParams.get('category');
  const dateFilter = searchParams.get('date');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const location = searchParams.get('location');

  // Client tarafında olduğumuzu kontrol et (hydration hatası önlemek için)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);

        // MongoDB API için sorgu parametreleri oluştur
        let queryParams: any = {};

        // Kategori filtresi
        if (categoryId) {
          queryParams.category = categoryId;
        }

        // Fiyat filtresi
        if (minPrice) queryParams.minPrice = Number(minPrice);
        if (maxPrice) queryParams.maxPrice = Number(maxPrice);

        // Konum filtresi - MongoDB API'niz location araması destekliyorsa
        if (location) {
          queryParams.location = location;
        }

        // Tarih filtresi
        if (dateFilter) {
          queryParams.dateFilter = dateFilter;
        }

        // MongoDB API'ye sorgu yap
        const response = await axios.get('http://localhost:5000/api/events', { params: queryParams });

        if (response.data && response.data.data) {
          setEvents(response.data.data);
        }
      } catch (error) {
        console.error("Etkinlikler yüklenirken hata:", error);
        toast.error("Etkinlikler yüklenemedi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [categoryId, dateFilter, minPrice, maxPrice, location]);

  // Sepete ekleme işlemi - giriş yapılıp yapılmadığına bakılmaksızın eklenebilir
  const handleAddToCart = (event: Event, e: React.MouseEvent) => {
    e.preventDefault(); // Link tıklamasını engelle
    e.stopPropagation(); // Etkinliğin tüm alanına tıklamayı engelle

    addToCart(event);
    toast.success(`${event.title} sepete eklendi.`);
  };

  // Resim URL'i belirlemek için yardımcı fonksiyon
  const getEventImage = (event: Event) => {
    if (event.coverImage) return event.coverImage;
    if (event.image) return event.image;
    // Hiçbir resim yoksa varsayılan resmi göster
    return "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80";
  };

  // Tarih formatlayıcı fonksiyon
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="flex flex-col rounded-lg overflow-hidden border border-border bg-card animate-pulse">
              <div className="h-48 bg-muted"></div>
              <div className="flex-1 p-6">
                <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-muted rounded mb-4 w-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                  <div className="h-8 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((event) => (
          <div
            key={event._id}
            className="flex flex-col rounded-lg overflow-hidden border border-border bg-card transition-all duration-200 hover:border-primary hover:shadow-md"
          >
            <div className="relative h-48 bg-muted">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${getEventImage(event)})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {event.category?.name || "Genel"}
                </span>
              </div>
            </div>
            <div className="flex-1 p-4 sm:p-6 flex flex-col">
              <h3 className="text-base sm:text-lg font-medium text-foreground line-clamp-2">{event.title}</h3>
              <div className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </div>
              <div className="mt-3 space-y-1 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>
              <div className="mt-auto pt-4 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                <div className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-0">
                  {event.price} ₺
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {isClient && isInCart(event._id) ? (
                    <Button size="sm" disabled variant="outline" className="flex items-center text-xs sm:text-sm w-full sm:w-auto">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Sepette
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleAddToCart(event, e)}
                      className="flex items-center text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Sepete Ekle
                    </Button>
                  )}
                  <Link href={`/events/${event._id}`} className="w-full sm:w-auto">
                    <Button size="sm" className="text-xs sm:text-sm w-full">Detaylar</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {events.length === 0 && !isLoading && (
        <div className="text-center py-8 sm:py-12 bg-card rounded-lg border border-border p-4 sm:p-8">
          <h3 className="text-base sm:text-lg font-medium text-foreground">Etkinlik bulunamadı</h3>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Seçtiğiniz filtrelere uygun etkinlik bulunmamaktadır. Lütfen farklı filtreler ile tekrar deneyin.
          </p>
          <Button
            onClick={() => window.location.href = '/events'}
            variant="outline"
            className="mt-4 sm:mt-6 text-xs sm:text-sm"
          >
            Tüm Etkinlikleri Göster
          </Button>
        </div>
      )}
    </div>
  );
}
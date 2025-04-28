"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface Event {
  id: string;
  attributes: {
    baslik: string;
    aciklama: string;
    lokasyon: string;
    tarih: string;
    fiyat: number;
    kapakFoto: {
      data: {
        attributes: {
          url: string;
        };
      };
    } | null;
    kategori: {
      data: {
        id: number;
        attributes: {
          isim: string;
        };
      };
    } | null;
  };
}

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  // URL'den filtre parametrelerini al
  const categoryId = searchParams.get('category');
  const dateFilter = searchParams.get('date');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const location = searchParams.get('location');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);

        // Strapi filtre parametrelerini oluştur
        let filters: any = {};

        // Kategori filtresi
        if (categoryId) {
          filters['kategori'] = {
            id: {
              $eq: categoryId
            }
          };
        }

        // Fiyat filtresi
        if (minPrice || maxPrice) {
          filters['fiyat'] = {};
          if (minPrice) filters['fiyat']['$gte'] = Number(minPrice);
          if (maxPrice) filters['fiyat']['$lte'] = Number(maxPrice);
        }

        // Konum filtresi
        if (location) {
          filters['lokasyon'] = {
            $containsi: location
          };
        }

        // Tarih filtresi
        if (dateFilter) {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];

          switch (dateFilter) {
            case 'today':
              filters['tarih'] = {
                $eq: todayStr
              };
              break;
            case 'this-week': {
              const endOfWeek = new Date(today);
              endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
              filters['tarih'] = {
                $gte: todayStr,
                $lte: endOfWeek.toISOString().split('T')[0]
              };
              break;
            }
            case 'this-month': {
              const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              filters['tarih'] = {
                $gte: todayStr,
                $lte: endOfMonth.toISOString().split('T')[0]
              };
              break;
            }
            case 'next-month': {
              const firstOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
              const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
              filters['tarih'] = {
                $gte: firstOfNextMonth.toISOString().split('T')[0],
                $lte: endOfNextMonth.toISOString().split('T')[0]
              };
              break;
            }
          }
        }

        // Sorgu parametresini oluştur
        const queryParams = {
          populate: 'kapakFoto,kategori',
          filters: Object.keys(filters).length > 0 ? filters : undefined
        };

        // Strapi'ye sorgu yap
        const response = await axios.get('http://localhost:1337/api/events', {
          params: {
            populate: queryParams.populate,
            filters: queryParams.filters ? JSON.stringify(queryParams.filters) : undefined
          }
        });

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

  // Tarih formatlayıcı fonksiyon
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Sabit bir varsayılan resim URL'i
  const defaultImageUrl = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80";

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex flex-col rounded-lg overflow-hidden border border-border bg-card transition-all duration-200 hover:border-primary hover:shadow-md"
          >
            <div className="relative h-48 bg-muted">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${event.attributes.kapakFoto?.data?.attributes?.url
                      ? `http://localhost:1337${event.attributes.kapakFoto.data.attributes.url}`
                      : defaultImageUrl
                    })`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {event.attributes.kategori?.data?.attributes?.isim || "Genel"}
                </span>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col">
              <h3 className="text-lg font-medium text-foreground">{event.attributes.baslik}</h3>
              <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {event.attributes.aciklama}
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatDate(event.attributes.tarih)}
                </div>
                {/* <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  {event.time}
                </div> */}
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  {event.attributes.lokasyon}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-lg font-semibold text-foreground">
                  {event.attributes.fiyat} ₺
                </div>
                <Link href={`/events/${event.id}`}>
                  <Button size="sm">Bilet Al</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      {events.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-card rounded-lg border border-border p-8">
          <h3 className="text-lg font-medium text-foreground">Etkinlik bulunamadı</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Seçtiğiniz filtrelere uygun etkinlik bulunmamaktadır. Lütfen farklı filtreler ile tekrar deneyin.
          </p>
          <Button
            onClick={() => window.location.href = '/events'}
            variant="outline"
            className="mt-6"
          >
            Tüm Etkinlikleri Göster
          </Button>
        </div>
      )}
    </div>
  );
}
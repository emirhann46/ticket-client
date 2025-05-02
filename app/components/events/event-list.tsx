"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

// MongoDB Event tipini tanımlıyoruz
interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  price: number;
  coverImage: string;
  category: {
    _id: string;
    name: string;
  };
  organizerId: string;
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
            key={event._id}
            className="flex flex-col rounded-lg overflow-hidden border border-border bg-card transition-all duration-200 hover:border-primary hover:shadow-md"
          >
            <div className="relative h-48 bg-muted">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${event.coverImage || defaultImageUrl})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {event.category?.name || "Genel"}
                </span>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col">
              <h3 className="text-lg font-medium text-foreground">{event.title}</h3>
              <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  {event.location}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-lg font-semibold text-foreground">
                  {event.price} ₺
                </div>
                <Link href={`/events/${event._id}`}>
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
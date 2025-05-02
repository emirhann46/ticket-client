"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import axios from "axios";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import useCart from "@/app/hooks/useCart";
import { toast } from "react-hot-toast";
import useAuthStore from "@/app/hooks/useAuth";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  coverImage: string;
  isApproved: boolean;
  category: {
    _id: string;
    name: string;
  };
}

export function FeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem, items } = useCart();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        // Onaylı etkinlikleri getir ve en son eklenenlerden 4 tanesini göster
        const response = await axios.get('http://localhost:5000/api/events?isApproved=true&limit=4');
        if (response.data && response.data.data) {
          setEvents(response.data.data);
        }
      } catch (error) {
        console.error("Etkinlikler yüklenirken hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  const handleAddToCart = (event: Event) => {
    // Admin rolü kontrolü
    if (user?.role === "admin") {
      toast.error("Admin kullanıcılar sepete ürün ekleyemez");
      return;
    }

    // Ürün zaten sepette mi kontrol et
    if (items.some(item => item.event._id === event._id)) {
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

    toast.success("Etkinlik sepete eklendi");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-80 rounded-lg bg-muted animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-muted-foreground">Şu anda öne çıkan etkinlik bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {events.map((event) => (
        <Card
          key={event._id}
          className="flex flex-col overflow-hidden group hover:shadow-lg transition-shadow min-w-0"
        >
          <div className="relative h-48 w-full">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 w-full">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                {event.category?.name || "Etkinlik"}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
              {event.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
              {event.description}
            </p>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>
                  {new Date(event.date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div className="p-4 pt-0 mt-auto flex items-center justify-between">
            <div className="text-lg font-semibold">{formatPrice(event.price)}</div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddToCart(event)}
                disabled={user?.role === "admin" || items.some(item => item.event._id === event._id)}
              >
                {items.some(item => item.event._id === event._id) ? "Sepette" : "Sepete Ekle"}
              </Button>
              <Link href={`/events/${event._id}`}>
                <Button size="sm">Detaylar</Button>
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>

  );
}
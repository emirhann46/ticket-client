"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Share2,
  Heart,
  Users,
  Check,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAuthStore from "@/app/hooks/useAuth";
import useCart from "@/app/hooks/useCart";
import { useRouter } from "next/navigation";
import { Event } from "@/app/constans/type";

interface EventPageProps {
  params: {
    id: string;
  };
}

export default function EventPage({
  params,
}: {
  params: Promise<EventPageProps["params"]>;
}) {
  const { id: eventId } = use(params);
  const [isLiked, setIsLiked] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
  const { isAuthenticated } = useAuthStore();
  const { addToCart, isInCart } = useCart();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/events/${eventId}`
        );
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
        const response = await axios.get(
          `http://localhost:5000/api/events?limit=3`
        );
        if (response.data && response.data.data) {
          setSimilarEvents(
            response.data.data
              .filter((e: any) => e._id !== eventId)
              .slice(0, 3)
          );
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
    toast.success(
      isLiked ? "Etkinlik favorilerden çıkarıldı" : "Etkinlik favorilere eklendi"
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: event?.title || "Etkinlik",
          text: event?.description || "",
          url: window.location.href,
        })
        .catch((err) => console.error("Paylaşım hatası:", err));
    } else {
      toast.success("Etkinlik bağlantısı panoya kopyalandı!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleAddToCart = () => {
    if (!event) return;
    addToCart(event);
    toast.success(`${event.title} sepete eklendi!`);
    setTimeout(() => {
      setIsClient(false);
      setIsClient(true);
    }, 100);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getEventImage = (event: Event | null) => {
    if (!event) return "";
    if (event.coverImage) return event.coverImage;
    if (event.image) return event.image;
    return "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80";
  };

  const getEventSliderImages = (event: Event | null) => {
    if (!event) return [];
    const images: string[] = [];
    const mainImage = getEventImage(event);
    if (mainImage) images.push(mainImage);
    if (event.sliderImages && event.sliderImages.length > 0) {
      event.sliderImages.forEach((img) => {
        if (!images.includes(img)) images.push(img);
      });
    }
    return images;
  };

  const nextSlide = () => {
    const slides = getEventSliderImages(event);
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    const slides = getEventSliderImages(event);
    setCurrentSlideIndex(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return <div>Etkinlik bulunamadı.</div>;
  }

  const sliderImages = getEventSliderImages(event);

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Sol taraf - Görseller */}
          <div className="lg:col-span-2">
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
              {sliderImages.length > 0 && (
                <Image
                  src={sliderImages[currentSlideIndex]}
                  alt={event.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              )}
              {/* Slider butonları */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 p-2 rounded-full"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 p-2 rounded-full"
              >
                <ChevronRight />
              </button>
            </div>
          </div>

          {/* Sağ taraf - Etkinlik Detayları */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm flex flex-col gap-4">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">{event.description}</p>
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>{event.location}</span>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Sepete Ekle
              </Button>
              <Button variant="outline" onClick={handleLike}>
                <Heart className="mr-2 h-4 w-4" />
                {isLiked ? "Favorilerden Çıkar" : "Favorilere Ekle"}
              </Button>
              <Button variant="ghost" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Paylaş
              </Button>
            </div>
          </div>
        </div>

        {/* Benzer Etkinlikler */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Benzer Etkinlikler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarEvents.map((e) => (
              <div key={e._id} className="border rounded-lg p-4">
                <Image
                  src={getEventImage(e)}
                  alt={e.title}
                  width={400}
                  height={200}
                  className="rounded-lg mb-2 object-cover w-full h-40"
                />
                <h3 className="font-bold">{e.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                <Button
                  className="mt-2"
                  onClick={() => router.push(`/events/${e._id}`)}
                >
                  Detayları Gör
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

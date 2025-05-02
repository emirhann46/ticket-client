"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ShoppingCart,
  Info,
  Tag,
  ArrowLeft,
  Share2 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import useCartStore from "@/app/hooks/useCart";
import useAuthStore from "@/app/hooks/useAuth";
import { toast } from "react-hot-toast";
import axios from "axios";

// Bilet türü arayüzü
interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  availableCount: number;
  maxPerPurchase: number;
}

// Etkinlik arayüzü
interface Event {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  date: string;
  time: string;
  location: string;
  address: string;
  organizer: string;
  organizerId: string;
  category: string;
  tags: string[];
  ticketTypes: TicketType[];
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { addItem, isInCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sepete ekle butonuna tıklanınca tetiklenir
  const handleAddToCart = (ticketType: TicketType) => {
    if (!isAuthenticated) {
      toast.error("Bilet satın almak için giriş yapmalısınız");
      router.push("/auth/login");
      return;
    }
    
    // Her zaman 1 adet bilet ekle
    const quantity = 1;
    
    // Seçilen bilet sepete ekleniyor
    const cartItem = {
      id: `${eventId}-${ticketType.id}`,
      eventId: eventId,
      eventTitle: event?.title || "",
      eventImage: event?.image || "",
      eventDate: event?.date || "",
      eventTime: event?.time || "", 
      eventLocation: event?.location || "",
      ticketType: ticketType.name,
      price: ticketType.price,
      quantity: quantity
    };
    
    addItem(cartItem);
    toast.success(`${ticketType.name} bileti sepete eklendi`);
    
    // Kullanıcıyı doğrudan sepet sayfasına yönlendir
    router.push("/cart");
  };
  
  // Etkinlik verilerini çek
  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      
      try {
        // Gerçek API çağrısı
        const response = await axios.get(`http://localhost:3001/api/events/${eventId}`);
        setEvent(response.data.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Etkinlik bilgileri alınırken hata oluştu:", error);
        toast.error("Etkinlik bilgileri yüklenirken bir sorun oluştu");
        
        // Hata durumunda yerine mock veri gösterilir (gerçek uygulamada bu kaldırılmalı)
        setTimeout(() => {
          setEvent({
            id: eventId,
            title: "Tech Summit 2025",
            description: "Teknoloji dünyasının önde gelen isimleriyle buluşma fırsatı",
            longDescription: "Tech Summit 2025, teknoloji dünyasının önde gelen isimlerini bir araya getiriyor. Yapay zeka, blockchain, siber güvenlik ve daha birçok alanda uzmanlarla tanışma ve networking fırsatı yakalayın. Gün boyu sürecek oturumlar, workshop'lar ve demo alanlarıyla dolu dolu bir etkinlik sizleri bekliyor.\n\nKatılımcılara özel sürpriz hediyeler ve kariyer fırsatları için yerinizi hemen ayırtın!",
            image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1112&q=80",
            date: "10 Nisan 2025",
            time: "09:00 - 18:00",
            location: "İstanbul Kongre Merkezi",
            address: "Harbiye, 34267 Şişli/İstanbul",
            organizer: "TechEvents Türkiye",
            organizerId: "org123",
            category: "Konferans",
            tags: ["Teknoloji", "Yapay Zeka", "Blockchain", "Networking"],
            ticketTypes: [
              {
                id: "standard",
                name: "Standart Bilet",
                price: 250,
                description: "Tüm oturumlara erişim, öğle yemeği dahil",
                availableCount: 150,
                maxPerPurchase: 5
              },
              {
                id: "vip",
                name: "VIP Bilet",
                price: 500,
                description: "Standart bilet + özel networking etkinliği ve konuşmacılarla tanışma fırsatı",
                availableCount: 50,
                maxPerPurchase: 2
              },
              {
                id: "workshop",
                name: "Workshop Paketi",
                price: 350,
                description: "Standart bilet + öğleden sonra workshop katılımı",
                availableCount: 75,
                maxPerPurchase: 3
              }
            ]
          });
          setIsLoading(false);
        }, 1000);
      }
    };
    
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);
  
  // Yükleme durumu
  if (isLoading) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center pt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Etkinlik bulunamadı
  if (!event) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Etkinlik Bulunamadı</h1>
          <p className="text-muted-foreground mb-8">İstediğiniz etkinlik bulunamadı veya kaldırılmış olabilir.</p>
          <Button onClick={() => router.push("/events")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Etkinliklere Dön
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => router.push("/events")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Etkinliklere Dön
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon - Etkinlik Detayları */}
          <div className="lg:col-span-2">
            <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden mb-6">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 text-foreground">{event.title}</h1>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="outline" className="bg-primary/10">
                {event.category}
              </Badge>
              {event.tags && event.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Tarih</p>
                      <p className="text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Saat</p>
                      <p className="text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Konum</p>
                      <p className="text-muted-foreground">{event.location}</p>
                      <p className="text-sm text-muted-foreground">{event.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="description" className="mb-10">
              <TabsList className="mb-4">
                <TabsTrigger value="description">Açıklama</TabsTrigger>
                <TabsTrigger value="details">Detaylar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="prose dark:prose-invert max-w-none">
                <p>{event.longDescription || event.description}</p>
              </TabsContent>
              
              <TabsContent value="details">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Organizatör</p>
                      <p className="text-muted-foreground">{event.organizer}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Tag className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Kategori</p>
                      <p className="text-muted-foreground">{event.category}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sağ Kolon - Bilet Satın Alma */}
          <div>
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm sticky top-24">
              <h2 className="text-xl font-bold mb-6 text-foreground">Bilet</h2>
              
              <div className="border border-border rounded-lg p-4 transition-all hover:border-primary">
                <div className="flex justify-between mb-4">
                  <h3 className="font-medium">Standart Bilet</h3>
                  <p className="font-bold">{event.price}₺</p>
                </div>
                
                <div className="flex justify-end items-center">
                  <Button
                    onClick={() => handleAddToCart({
                      id: "standard",
                      name: "Standart Bilet",
                      price: event.price,
                      description: "",
                      availableCount: event.availableTickets || 100,
                      maxPerPurchase: 5
                    })}
                    disabled={isInCart(eventId)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {isInCart(eventId) ? "Sepette" : "Sepete Ekle"}
                  </Button>
                </div>
              </div>
              
              <Button className="w-full mt-6" onClick={() => router.push("/cart")}>
                Sepete Git
              </Button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
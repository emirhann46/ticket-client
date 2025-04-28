"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Calendar, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import useAuthStore from "@/app/hooks/useAuth";

interface EventRequest {
  id: number;
  attributes: {
    baslik: string;
    aciklama: string;
    lokasyon: string;
    tarih: string;
    durum: "beklemede" | "onaylandi" | "reddedildi";
    createdAt: string;
    updatedAt: string;
    basvuran: {
      data: {
        id: number;
        attributes: {
          username: string;
          email: string;
        };
      };
    };
  };
}

export default function EventRequestsPage() {
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { jwt } = useAuthStore();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "http://localhost:1337/api/event-requests?populate=basvuran",
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      if (response.data && response.data.data) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error("Etkinlik başvuruları yüklenirken hata:", error);
      toast.error("Etkinlik başvuruları yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [jwt]);

  // Etkinlik onaylanırsa, gerçek bir etkinlik oluştur
  const createEvent = async (request: EventRequest) => {
    try {
      const eventData = {
        data: {
          baslik: request.attributes.baslik,
          aciklama: request.attributes.aciklama,
          lokasyon: request.attributes.lokasyon,
          tarih: request.attributes.tarih,
          fiyat: 0, // Varsayılan değer, sonra güncellenebilir
          organizer: request.attributes.basvuran.data.id,
        }
      };

      const response = await axios.post(
        "http://localhost:1337/api/events",
        eventData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Etkinlik oluşturulurken hata:", error);
      throw error;
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await axios.put(
        `http://localhost:1337/api/event-requests/${id}`,
        {
          data: { durum: newStatus }
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      if (response.data) {
        // Başvuru onaylandıysa, etkinliği oluştur
        if (newStatus === "onaylandi") {
          const request = requests.find(req => req.id === id);
          if (request) {
            try {
              await createEvent(request);
              toast.success("Etkinlik başarıyla oluşturuldu!");
            } catch (error) {
              toast.error("Etkinlik oluşturulurken bir hata oluştu");
            }
          }
        }

        toast.success(`Başvuru durumu güncellendi: ${newStatus}`);
        fetchRequests();
      }
    } catch (error) {
      console.error("Başvuru durumu güncellenirken hata:", error);
      toast.error("Başvuru durumu güncellenemedi");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "beklemede":
        return (
          <div className="flex items-center text-amber-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>Bekliyor</span>
          </div>
        );
      case "onaylandi":
        return (
          <div className="flex items-center text-green-500">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>Onaylandı</span>
          </div>
        );
      case "reddedildi":
        return (
          <div className="flex items-center text-red-500">
            <XCircle className="w-4 h-4 mr-1" />
            <span>Reddedildi</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Tarihi formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Etkinlik Başvuruları</h1>
        <div className="text-center py-10">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Etkinlik Başvuruları</h1>

      {requests.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Henüz bekleyen etkinlik başvurusu bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{request.attributes.baslik}</CardTitle>
                    <CardDescription>
                      Başvuran: {request.attributes.basvuran.data.attributes.username}
                    </CardDescription>
                  </div>
                  <div>{getStatusBadge(request.attributes.durum)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{request.attributes.aciklama}</p>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{formatDate(request.attributes.tarih)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{request.attributes.lokasyon}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Başvuru Tarihi: {formatDate(request.attributes.createdAt)}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between bg-muted/30 p-4">
                {request.attributes.durum === "beklemede" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-50 text-green-600 hover:bg-green-100"
                      onClick={() => handleStatusChange(request.id, "onaylandi")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Onayla ve Etkinlik Oluştur
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={() => handleStatusChange(request.id, "reddedildi")}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reddet
                    </Button>
                  </>
                )}
                {request.attributes.durum !== "beklemede" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-amber-50 text-amber-600 hover:bg-amber-100 w-full"
                    onClick={() => handleStatusChange(request.id, "beklemede")}
                  >
                    <Clock className="w-4 h-4 mr-1" /> Beklemede Olarak İşaretle
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
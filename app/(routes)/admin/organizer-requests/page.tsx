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
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import useAuthStore from "@/app/hooks/useAuth";

interface OrganizerRequest {
  id: number;
  attributes: {
    baslik: string;
    aciklama: string;
    durum: "beklemede" | "onaylandi" | "reddedildi";
    createdAt: string;
    updatedAt: string;
    user: {
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

export default function OrganizerRequestsPage() {
  const [requests, setRequests] = useState<OrganizerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { jwt } = useAuthStore();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "http://localhost:1337/api/organizer-requests?populate=user",
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
      console.error("Organizatör başvuruları yüklenirken hata:", error);
      toast.error("Organizatör başvuruları yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [jwt]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await axios.put(
        `http://localhost:1337/api/organizer-requests/${id}`,
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
        // Kullanıcı onaylandıysa, rolünü değiştir
        if (newStatus === "onaylandi") {
          const request = requests.find(req => req.id === id);
          if (request) {
            const userId = request.attributes.user.data.id;
            await axios.put(
              `http://localhost:1337/api/users/${userId}`,
              {
                rol: "organizer"
              },
              {
                headers: {
                  Authorization: `Bearer ${jwt}`,
                },
              }
            );
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Organizatör Başvuruları</h1>
        <div className="text-center py-10">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Organizatör Başvuruları</h1>

      {requests.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Henüz bekleyen başvuru bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{request.attributes.baslik}</CardTitle>
                    <CardDescription>
                      Başvuran: {request.attributes.user.data.attributes.username}
                    </CardDescription>
                  </div>
                  <div>{getStatusBadge(request.attributes.durum)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {request.attributes.aciklama}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Başvuru Tarihi: {new Date(request.attributes.createdAt).toLocaleDateString("tr-TR")}
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
                      <CheckCircle className="w-4 h-4 mr-1" /> Onayla
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
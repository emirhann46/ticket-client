"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { register } from "@/app/actions/register";
import useAuthStore from "@/app/hooks/useAuth";

// Role tipi tanımlama
type RoleType = "user" | "organizer";

// Form şemasını role değerine göre dinamik olarak oluşturalım
const getFormSchema = (role: RoleType) => {
  const baseSchema = {
    username: z.string().min(2, "Kullanıcı adı en az 2 karakter olmalıdır").max(50),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
    confirmPassword: z.string().min(8, "Şifre tekrarı en az 8 karakter olmalıdır"),
  };

  // Sadece organizatör için organizasyon adını ekle

  // Normal kullanıcı için sadece temel şema yeterli
  return z.object(baseSchema).refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") || "user") as RoleType;
  const [error, setError] = useState("");
  const { isLoading, setIsLoading, setUser, setJwt, user, setIsAuthenticated } = useAuthStore();

  // Role'e göre form şeması oluştur
  const formSchema = getFormSchema(role);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      ...(role === "organizer" ? { organizationName: "" } : {}),
    },
  });

  // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  async function onSubmit(values: any) {
    setError("");
    setIsLoading(true);
    try {
      const response = await register(values.username, values.email, values.password);
      console.log("Kayıt yanıtı:", response);

      if (response && response.user && response.jwt) {
        setUser(response.user);
        setJwt(response.jwt);
        setIsAuthenticated(true);
        toast.success("Kayıt başarılı! Ana sayfaya yönlendiriliyorsunuz.");
        router.push("/");
      } else {
        // API beklenen yapıda dönmezse
        toast.error("Kayıt işlemi başarısız oldu. Sunucu beklenmeyen bir yanıt verdi.");
        setError("Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.");
      }
    } catch (err: any) {
      console.error("Kayıt hatası:", err);
      let errorMsg = err.message || "Kayıt sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
      setError(errorMsg);
      toast.error(errorMsg);
      if (err.message && (err.message.includes("API sunucusuna bağlanılamıyor") || err.code === 'ERR_NETWORK')) {
        toast.error("Sunucu bağlantısı kurulamadı. API sunucunuzun çalıştığından emin olun ve doğru portu (5000) kullandığınızdan emin olun.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          {role === "organizer" ? "Organizatör Hesabı Oluştur" : "Yeni Hesap Oluştur"}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Veya{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:text-primary/90"
          >
            mevcut hesabınıza giriş yapın
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive text-sm rounded">
              {error}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Kullanıcı Adı" {...field} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta Adresi</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ornek@mail.com" {...field} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre Tekrar</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">
                  Veya şununla devam et
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91 .832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>GitHub</span>
                </Button>
              </div>

              <div>
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91 .832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Google</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

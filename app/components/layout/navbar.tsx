"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/app/components/theme/theme-switcher";
import { Button } from "@/components/ui/button";
import { UserCircle, ShoppingCart, Ticket, Gift, LogOut, User, Inbox, CalendarDays, Users, Building, PlusCircle, RefreshCw, Menu, X, Home } from "lucide-react";
import { useEffect, useState } from "react";
import useAuthStore from "@/app/hooks/useAuth";
import { toast } from "react-hot-toast";
import MobileMenu from "./mobile-menu";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, refreshUserData } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // SSR/CSR uyumsuzluğunu önle
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Kullanıcı rolünü doğru şekilde al
  const userRole = user?.role || user?.role;

  // Ana menü linkleri
  const navLinks = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/events", label: "Etkinlikler", icon: CalendarDays },
  ];

  // Rol bazlı linkler
  const getRoleBasedLinks = () => {
    if (!user) return [];

    const links = [
      { href: "/profile", label: "Profil", icon: User },
      { href: "/tickets", label: "Biletlerim", icon: Ticket },
      { href: "/cart", label: "Sepet", icon: ShoppingCart },
    ];

    if (userRole === "admin") {
      links.push({ href: "/admin", label: "Admin Panel", icon: Users });
    }

    if (userRole === "organizer") {
      links.push({ href: "/organizer/dashboard", label: "Organizatör Panel", icon: Building });
    }

    if (!["admin", "organizer"].includes(userRole || '')) {
      links.push({ href: "/organizer-application", label: "Organizatör Ol", icon: PlusCircle });
    }

    return links;
  };

  const activeLinks = getRoleBasedLinks();

  const handleLogout = () => {
    logout();
    toast.success("Başarıyla çıkış yapıldı");
    setMobileMenuOpen(false);
    router.push("/");
  };

  // Kullanıcı bilgilerini yenile
  const handleRefreshUserData = async () => {
    if (!isAuthenticated) return;

    setIsRefreshing(true);
    toast.loading("Bilgiler güncelleniyor...", { id: "refresh" });

    try {
      await refreshUserData();
      toast.success("Bilgiler güncellendi", { id: "refresh" });

      // Kullanıcının yetkisi değiştiyse uygun sayfaya yönlendir
      if (userRole !== "admin" && pathname.startsWith("/admin")) {
        toast.error("Admin yetkiniz kaldırıldı");
        router.push("/");
      }
    } catch (error) {
      console.error("Bilgiler güncellenirken hata:", error);
      toast.error("Bilgiler güncellenemedi", { id: "refresh" });
    } finally {
      setIsRefreshing(false);
    }
  };

  // CSR/SSR uyumsuzluğunu önle
  if (!isClient) {
    return null;
  }

  return (
    <nav className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo ve Ana Menü */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              Logo
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex justify-center items-center px-3 lg:mr-1 pt-1 border-b-2 text-sm font-medium cursor-pointer ${pathname === link.href
                      ? "border-primary text-primary"
                      : "border-transparent text-foreground hover:border-border hover:text-primary"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sağ Menü */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <ThemeSwitcher />

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                {activeLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`flex w-18 flex-col p-4 cursor-pointer ${pathname === link.href ? "bg-accent" : ""
                        }`}
                    >
                      <link.icon className="h-5 w-5" />
                      <span className="text-xs mt-1 mb-1">{link.label}</span>
                    </Button>
                  </Link>
                ))}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="flex flex-col items-center"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-xs mt-1">Çıkış</span>
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost">Giriş Yap</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Kayıt Ol</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobil Menü Butonu */}
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div >

      {/* Mobil Menü */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        navLinks={navLinks}
        activeLinks={activeLinks}
        isAuthenticated={isAuthenticated}
        user={user}
        pathname={pathname}
        handleLogout={handleLogout}
        handleRefreshUserData={handleRefreshUserData}
        isRefreshing={isRefreshing}
      />
    </nav >
  );
}

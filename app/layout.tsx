import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kipo",
  description: "Sistema de gestão de estoque, vendas e cardápio digital.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kipo",
  },
  icons: {
    apple: "/logo/logomarca-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C3AED",
};

const inter = Inter({
  subsets: ["latin"],
  display: "auto",
});

import { CookieBanner } from "@/components/cookie-banner";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { SessionClearHandler } from "./_components/auth/session-clear-handler";
import { PWAInstallBanner } from "./_components/pwa/pwa-install-banner";
import { ServiceWorkerRegister } from "./_components/pwa/service-worker-register";
import { ScrollRestoration } from "./_components/scroll-restoration";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <ServiceWorkerRegister />
        <Suspense fallback={null}>
          <ScrollRestoration />
          <SessionClearHandler />
        </Suspense>
        {children}
        <CookieBanner />
        <Toaster richColors closeButton position="top-left" />
        <PWAInstallBanner />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

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

import { Toaster } from "sonner";
import { CookieBanner } from "@/components/cookie-banner";
import { SessionClearHandler } from "./_components/auth/session-clear-handler";
import { ServiceWorkerRegister } from "./_components/pwa/service-worker-register";
import { PWAInstallBanner } from "./_components/pwa/pwa-install-banner";
import { Suspense } from "react";

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

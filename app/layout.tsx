import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Kipo",
  description: "O sistema de gestão para seu negócio",
};

const inter = Inter({
  subsets: ["latin"],
  display: "auto",
});

import { Toaster } from "sonner";
import { CookieBanner } from "@/components/cookie-banner";
import { SessionClearHandler } from "./_components/auth/session-clear-handler";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <Suspense fallback={null}>
          <SessionClearHandler />
        </Suspense>
        {children}
        <CookieBanner />
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}

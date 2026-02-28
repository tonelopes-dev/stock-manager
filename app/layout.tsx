import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Stockly",
  description: "Sistema de gerenciamento de estoque",
};

const inter = Inter({
  subsets: ["latin"],
  display: "auto",
});

import { Toaster } from "sonner";
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
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}

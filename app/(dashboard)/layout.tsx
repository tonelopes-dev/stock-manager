import type { Metadata } from "next";
import "../globals.css";
import Sidebar from "../_components/sidebar";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Stockly - Dashboard",
  description: "Gerenciamento de estoque",
};

const inter = Inter({
  subsets: ["latin"],
  display: "auto",
});

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-gray-100">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

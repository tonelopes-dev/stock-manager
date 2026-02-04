import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stockly",
  description: "Sistema de gerenciamento de estoque",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}


import type { Metadata } from "next";
import "../globals.css";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Stockly - Cadastro",
  description: "Crie sua conta Stockly",
};

const inter = Inter({
  subsets: ["latin"],
  display: "auto",
});

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          {children}
        </div>
      </body>
    </html>
  );
}

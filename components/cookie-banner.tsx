"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/_components/ui/button";
import Link from "next/link";
import { CookieIcon } from "lucide-react";

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("kipo-cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("kipo-cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="rounded-2xl border border-border bg-background/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <CookieIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-bold text-foreground">Cookies & Privacidade</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Utilizamos cookies essenciais para garantir o funcionamento da plataforma Kipo, como autenticação e segurança, conforme a LGPD. 
                Ao continuar, você concorda com nossos{" "}
                <Link href="/termos" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link href="/privacidade" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                  Política de Privacidade
                </Link>.
              </p>
            </div>
            <Button 
              onClick={acceptCookies} 
              className="w-full font-bold shadow-lg shadow-primary/20"
            >
              Aceitar e Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

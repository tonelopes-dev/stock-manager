"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. O Radix UI / Shadcn UI injetam overflow: hidden e pointer-events: none ao abrir modais/sheets.
    // 2. Se a rota mudar abruptamente (ex: atalhos ou links de navegação dentro do sheet), a trava de scroll fica ativa.
    // 3. Este cleanup restaura os estilos e remove o data-scroll-locked globalmente em cada mudança de rota.
    const unlockScroll = () => {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.pointerEvents = "";
      document.body.removeAttribute("data-scroll-locked");
    };

    unlockScroll();

    // Roda novamente com setTimeout para lidar com transições assíncronas de rota ou encerramento de animações do Radix UI
    const timeout = setTimeout(unlockScroll, 100);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return null;
}

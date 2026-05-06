'use client';

import { usePWAInstall } from '@/app/_hooks/use-pwa-install';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export function PWAInstallBanner() {
  const { state, isIOS, install, dismiss } = usePWAInstall();
  const isDesktop = useIsDesktop();

  const visible = state === 'ready' || state === 'ios';

  if (!isDesktop) return null;

  /* ─── Layout: toast horizontal no canto inferior direito ─── */
  return (
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-5 right-5 z-50 w-[360px]"
          >
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-white/10">
              {/* Dot-grid texture */}
              <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage: 'radial-gradient(#a78bfa 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              />
              {/* Blobs */}
              <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-violet-600/30 blur-[50px]" />
              <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-orange-400/20 blur-[50px]" />

              {/* Conteúdo horizontal */}
              <div className="relative z-10 flex items-center gap-3 p-4">
                {/* Ícone */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Image
                    src="/logo/logomarca-192.png"
                    alt="Kipo"
                    width={36}
                    height={36}
                    className="rounded-lg"
                  />
                </div>

                {/* Texto */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">Instalar o Kipo</p>
                  {isIOS ? (
                    <p className="mt-0.5 text-xs leading-snug text-zinc-400">
                      Toque em{' '}
                      <span className="inline-flex items-center gap-0.5 font-medium text-violet-400">
                        <Share size={11} />
                        Compartilhar
                      </span>{' '}
                      → <span className="font-medium text-violet-400">&quot;Adicionar à Tela de Início&quot;</span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Acesso rápido sem abrir o navegador
                    </p>
                  )}
                </div>

                {/* Ações: fechar + instalar */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <button
                    onClick={dismiss}
                    className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Fechar"
                  >
                    <X size={13} />
                  </button>
                  {!isIOS && (
                    <button
                      onClick={install}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500 active:scale-95"
                    >
                      <Download size={12} />
                      Instalar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  );
}

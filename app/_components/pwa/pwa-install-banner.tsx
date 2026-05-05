'use client';

import { usePWAInstall } from '@/app/_hooks/use-pwa-install';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, X } from 'lucide-react';
import Image from 'next/image';

export function PWAInstallBanner() {
  const { state, isIOS, install, dismiss } = usePWAInstall();

  const visible = state === 'ready' || state === 'ios';

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Card centralizado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl shadow-black/60 pointer-events-auto">

              {/* Dot-grid texture */}
              <div
                className="absolute inset-0 opacity-[0.18]"
                style={{
                  backgroundImage: 'radial-gradient(#a78bfa 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              />

              {/* Blobs de luz (mesmo estilo do login) */}
              <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-violet-600/30 blur-[60px]" />
              <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-orange-400/20 blur-[60px]" />

              {/* Conteúdo */}
              <div className="relative z-10 p-6">
                {/* Topo: ícone + fechar */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <Image
                      src="/logo/logomarca-192.png"
                      alt="Kipo"
                      width={44}
                      height={44}
                      className="rounded-xl"
                    />
                  </div>
                  <button
                    onClick={dismiss}
                    className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Fechar"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Texto */}
                {isIOS ? (
                  <>
                    <h3 className="text-lg font-bold text-white">
                      Instalar o Kipo
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                      Para adicionar à tela inicial, toque em{' '}
                      <span className="inline-flex items-center gap-0.5 font-semibold text-violet-400">
                        <Share size={13} />
                        Compartilhar
                      </span>{' '}
                      e selecione{' '}
                      <span className="font-semibold text-violet-400">
                        &quot;Adicionar à Tela de Início&quot;
                      </span>
                      .
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-white">
                      Instalar o Kipo
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      Acesse o Kipo direto da sua tela inicial, sem precisar
                      abrir o navegador.
                    </p>
                  </>
                )}

                {/* Ações */}
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={dismiss}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
                  >
                    Agora não
                  </button>
                  {!isIOS && (
                    <button
                      onClick={install}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:scale-95"
                    >
                      <Download size={15} />
                      Instalar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


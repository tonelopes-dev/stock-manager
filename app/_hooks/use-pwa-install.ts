'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallState = 'pending' | 'ready' | 'ios' | 'installed' | 'dismissed';

interface UsePWAInstallReturn {
  state: InstallState;
  isIOS: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
}

const STORAGE_KEY = 'pwa-install-dismissed-at';
const DISMISS_DAYS = 5;

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const daysSince = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function persistDismiss(): void {
  try {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch {
    // localStorage indisponível (modo privado restrito)
  }
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [state, setState] = useState<InstallState>('pending');
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setState('installed');
      return;
    }

    // Usuário fechou recentemente — não incomoda
    if (wasDismissedRecently()) {
      setState('dismissed');
      return;
    }

    // iOS não suporta beforeinstallprompt — detecta manualmente
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(navigator as unknown as { standalone?: boolean }).standalone;

    if (isIOS) {
      setState('ios');
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState('ready');
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setState('installed');
    } else {
      // Recusou no prompt nativo — também conta como dismiss
      persistDismiss();
      setState('dismissed');
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    persistDismiss();
    setState('dismissed');
  };

  return {
    state,
    isIOS: state === 'ios',
    install,
    dismiss,
  };
}


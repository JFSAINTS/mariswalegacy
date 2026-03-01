import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isCapacitor = () =>
  !!(window as any).Capacitor?.isNativePlatform?.() || !!(window as any).Capacitor?.platform;

const isStandalone = () =>
  isCapacitor() ||
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true;

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      setCanInstall(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setCanInstall(false);
      setIsInstalled(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return { canInstall, isInstalled, isIos, promptInstall };
}

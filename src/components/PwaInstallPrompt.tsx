import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true;

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3 max-w-md mx-auto">
        <div className="bg-primary/10 rounded-lg p-2 shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Instalar aplicación</p>
          {isIos ? (
            <p className="text-xs text-muted-foreground mt-1">
              Toca <span className="font-medium">Compartir</span> y luego{' '}
              <span className="font-medium">Agregar a pantalla de inicio</span>.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Instala la app para acceder sin conexión y una mejor experiencia.
            </p>
          )}
          {!isIos && (
            <Button size="sm" className="mt-2 h-8 text-xs" onClick={handleInstall}>
              Instalar
            </Button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;

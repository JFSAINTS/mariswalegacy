import { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { usePdfDocument } from '@/hooks/usePdfDocument';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { PdfCanvas } from '@/components/pdf/PdfCanvas';
import { ViewerToolbar } from '@/components/pdf/ViewerToolbar';
import { SidePanel } from '@/components/pdf/SidePanel';
import { SearchOverlay } from '@/components/pdf/SearchOverlay';
import { TranslateOverlay } from '@/components/pdf/TranslateOverlay';
import { Loader2, FileWarning, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PDF_URL = '/sample.pdf';

const Index = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { canInstall, isIos, promptInstall } = usePwaInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (canInstall && !sessionStorage.getItem('pwa-install-dismissed')) {
      const timer = setTimeout(() => setShowInstallBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [canInstall]);
  const {
    numPages, loading, error, outline,
    renderPage, searchAllPages, resolveDestination, getPageViewport, getPageText, getPageAnnotations, getPageTextContent,
  } = usePdfDocument(PDF_URL);

  const {
    bookmarks, removeBookmark, updateBookmark, isBookmarked, toggleBookmark,
  } = useBookmarks();

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) setCurrentPage(page);
  }, [numPages]);

  const handleOutlineClick = useCallback(async (dest: any) => {
    const page = await resolveDestination(dest);
    if (page) {
      setCurrentPage(page);
      setSidebarOpen(false);
    }
  }, [resolveDestination]);

  const handleSearchNavigate = useCallback((page: number) => {
    setCurrentPage(page);
    setSearchOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center">
          <FileWarning className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Verifica que el archivo PDF existe en /public/sample.pdf
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      <ViewerToolbar
        currentPage={currentPage}
        numPages={numPages}
        onPageChange={handlePageChange}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onToggleSearch={() => setSearchOpen(prev => !prev)}
        onToggleTranslate={() => setTranslateOpen(prev => !prev)}
        isBookmarked={isBookmarked(currentPage)}
        onToggleBookmark={() => toggleBookmark(currentPage)}
        zoom={zoom}
        onZoomChange={setZoom}
        isDark={theme === 'dark'}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        canInstallPwa={canInstall}
        onInstallPwa={async () => {
          if (isIos) {
            setShowInstallBanner(true);
          } else {
            await promptInstall();
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <SidePanel
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          outline={outline}
          bookmarks={bookmarks}
          onNavigate={(page) => { setCurrentPage(page); setSidebarOpen(false); }}
          onOutlineClick={handleOutlineClick}
          onRemoveBookmark={removeBookmark}
          onUpdateBookmark={updateBookmark}
          numPages={numPages}
          currentPage={currentPage}
          renderPage={renderPage}
          getPageViewport={getPageViewport}
        />

        <PdfCanvas
          renderPage={renderPage}
          getPageViewport={getPageViewport}
          getPageAnnotations={getPageAnnotations}
          getPageTextContent={getPageTextContent}
          pageNumber={currentPage}
          zoom={zoom}
          onZoomChange={setZoom}
          onSwipeLeft={() => handlePageChange(currentPage + 1)}
          onSwipeRight={() => handlePageChange(currentPage - 1)}
        />

        <SearchOverlay
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSearch={searchAllPages}
          onNavigate={handleSearchNavigate}
        />

        <TranslateOverlay
          open={translateOpen}
          onClose={() => setTranslateOpen(false)}
          getPageText={getPageText}
          currentPage={currentPage}
          numPages={numPages}
        />
      </div>

      {showInstallBanner && canInstall && (
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
                <>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instala la app para acceder sin conexión y una mejor experiencia.
                  </p>
                  <Button size="sm" className="mt-2 h-8 text-xs" onClick={async () => {
                    await promptInstall();
                    setShowInstallBanner(false);
                  }}>
                    Instalar
                  </Button>
                </>
              )}
            </div>
            <button
              onClick={() => {
                setShowInstallBanner(false);
                sessionStorage.setItem('pwa-install-dismissed', '1');
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

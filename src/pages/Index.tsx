import { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { usePdfDocument } from '@/hooks/usePdfDocument';
import { useBookmarks } from '@/hooks/useBookmarks';
import { PdfCanvas } from '@/components/pdf/PdfCanvas';
import { ViewerToolbar } from '@/components/pdf/ViewerToolbar';
import { SidePanel } from '@/components/pdf/SidePanel';
import { SearchOverlay } from '@/components/pdf/SearchOverlay';
import { TranslateOverlay } from '@/components/pdf/TranslateOverlay';
import { Loader2, FileWarning } from 'lucide-react';

const PDF_URL = '/sample.pdf';

const Index = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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
    </div>
  );
};

export default Index;

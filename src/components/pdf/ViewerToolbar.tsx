import {
  ChevronLeft, ChevronRight, Search, Bookmark, BookmarkCheck,
  Menu, ZoomIn, ZoomOut, Moon, Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Props {
  currentPage: number;
  numPages: number;
  onPageChange: (page: number) => void;
  onToggleSidebar: () => void;
  onToggleSearch: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function ViewerToolbar({
  currentPage, numPages, onPageChange, onToggleSidebar, onToggleSearch,
  isBookmarked, onToggleBookmark, zoom, onZoomChange, isDark, onToggleTheme,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [pageInput, setPageInput] = useState('');

  const handlePageSubmit = () => {
    const num = parseInt(pageInput);
    if (num >= 1 && num <= numPages) onPageChange(num);
    setEditing(false);
    setPageInput('');
  };

  return (
    <header className="h-14 flex items-center px-2 gap-1 border-b bg-card/90 backdrop-blur-sm shrink-0 z-20">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="shrink-0">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-0.5 mx-auto">
        <Button variant="ghost" size="icon" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); handlePageSubmit(); }}>
            <Input
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageSubmit}
              className="w-14 h-7 text-center text-sm p-0"
              min={1}
              max={numPages}
              autoFocus
            />
          </form>
        ) : (
          <button
            onClick={() => { setEditing(true); setPageInput(String(currentPage)); }}
            className="text-sm font-medium tabular-nums min-w-[56px] text-center hover:bg-secondary rounded px-1.5 py-1 transition-colors"
          >
            {currentPage} / {numPages}
          </button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= numPages} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))} className="h-8 w-8 hidden sm:flex">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs tabular-nums w-9 text-center hidden sm:block text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" onClick={() => onZoomChange(Math.min(3, zoom + 0.25))} className="h-8 w-8 hidden sm:flex">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleSearch} className="h-8 w-8">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleBookmark} className="h-8 w-8">
          {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleTheme} className="h-8 w-8">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}

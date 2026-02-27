import { X, FileText, BookMarked, ChevronRight, ChevronDown, Trash2, Edit2, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { OutlineItem } from '@/hooks/usePdfDocument';
import type { Bookmark } from '@/hooks/useBookmarks';

interface Props {
  open: boolean;
  onClose: () => void;
  outline: OutlineItem[];
  bookmarks: Bookmark[];
  onNavigate: (page: number) => void;
  onOutlineClick: (dest: any) => void;
  onRemoveBookmark: (id: string) => void;
  onUpdateBookmark: (id: string, title: string) => void;
  numPages: number;
  currentPage: number;
  renderPage: (pageNum: number, canvas: HTMLCanvasElement, scale: number) => Promise<any>;
  getPageViewport: (pageNum: number, scale: number) => Promise<any>;
}

type Tab = 'outline' | 'bookmarks' | 'thumbnails';

function OutlineTree({ items, onOutlineClick, depth = 0 }: {
  items: OutlineItem[];
  onOutlineClick: (dest: any) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(items.map((_, i) => i)));

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <ul className={depth > 0 ? 'ml-3 border-l border-border/50 pl-2' : ''}>
      {items.map((item, i) => (
        <li key={i}>
          <div className="flex items-center gap-1 py-1.5">
            {item.items?.length > 0 ? (
              <button
                onClick={() => toggle(i)}
                className="h-5 w-5 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded.has(i) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <button
              onClick={() => onOutlineClick(item.dest)}
              className="text-sm text-left truncate hover:text-primary transition-colors flex-1"
            >
              {item.title}
            </button>
          </div>
          {item.items?.length > 0 && expanded.has(i) && (
            <OutlineTree items={item.items} onOutlineClick={onOutlineClick} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

function Thumbnail({ pageNum, renderPage, getPageViewport, isActive, onClick }: {
  pageNum: number;
  renderPage: Props['renderPage'];
  getPageViewport: Props['getPageViewport'];
  isActive: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendered.current = true;

    (async () => {
      const vp = await getPageViewport(pageNum, 1);
      if (!vp) return;
      const thumbWidth = 200;
      const scale = thumbWidth / vp.width;
      await renderPage(pageNum, canvas, scale * (window.devicePixelRatio || 1));
      canvas.style.width = `${vp.width * scale}px`;
      canvas.style.height = `${vp.height * scale}px`;
    })();
  }, [pageNum, renderPage, getPageViewport]);

  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
        isActive ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-secondary/60'
      }`}
    >
      <canvas ref={canvasRef} className="rounded shadow-sm max-w-full" />
      <span className={`text-xs tabular-nums ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
        {pageNum}
      </span>
    </button>
  );
}

export function SidePanel({
  open, onClose, outline, bookmarks, onNavigate, onOutlineClick, onRemoveBookmark, onUpdateBookmark,
  numPages, currentPage, renderPage, getPageViewport,
}: Props) {
  const [tab, setTab] = useState<Tab>(outline.length > 0 ? 'outline' : 'thumbnails');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEdit = (bm: Bookmark) => {
    setEditingId(bm.id);
    setEditTitle(bm.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onUpdateBookmark(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-foreground/20 z-30 lg:hidden" onClick={onClose} />
      )}

      <div className={`
        fixed left-0 top-0 bottom-0 w-72 bg-card border-r z-40
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:z-10
        flex flex-col shadow-xl
      `}>
        <div className="h-14 flex items-center justify-between px-3 border-b shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('outline')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                tab === 'outline' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Índice
            </button>
            <button
              onClick={() => setTab('thumbnails')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                tab === 'thumbnails' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Páginas
            </button>
            <button
              onClick={() => setTab('bookmarks')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                tab === 'bookmarks' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <BookMarked className="h-3.5 w-3.5" />
              Marcadores
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          {tab === 'outline' && (
            outline.length > 0 ? (
              <OutlineTree items={outline} onOutlineClick={onOutlineClick} />
            ) : (
              <p className="text-sm text-muted-foreground text-center mt-8">
                Este PDF no tiene índice estructurado
              </p>
            )
          )}

          {tab === 'thumbnails' && (
            <div className="grid grid-cols-1 gap-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map(p => (
                <Thumbnail
                  key={p}
                  pageNum={p}
                  renderPage={renderPage}
                  getPageViewport={getPageViewport}
                  isActive={p === currentPage}
                  onClick={() => onNavigate(p)}
                />
              ))}
            </div>
          )}

          {tab === 'bookmarks' && (
            bookmarks.length > 0 ? (
              <ul className="space-y-0.5">
                {bookmarks.sort((a, b) => a.page - b.page).map(bm => (
                  <li key={bm.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/60 group">
                    {editingId === bm.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="flex-1">
                        <Input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onBlur={saveEdit}
                          className="h-7 text-sm"
                          autoFocus
                        />
                      </form>
                    ) : (
                      <button
                        onClick={() => onNavigate(bm.page)}
                        className="flex-1 text-left text-sm truncate hover:text-primary transition-colors"
                      >
                        <span className="text-primary font-semibold mr-2 text-xs">p.{bm.page}</span>
                        {bm.title}
                      </button>
                    )}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => startEdit(bm)} className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded">
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => onRemoveBookmark(bm.id)} className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive rounded">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center mt-8">
                <BookMarked className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Sin marcadores aún
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Usa el icono de marcador en la barra superior
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

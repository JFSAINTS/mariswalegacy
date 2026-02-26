import { useState, useCallback } from 'react';
import { Search, X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SearchResult } from '@/hooks/usePdfDocument';

interface Props {
  open: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onNavigate: (page: number) => void;
}

export function SearchOverlay({ open, onClose, onSearch, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await onSearch(query);
      setResults(res);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, [query, onSearch]);

  const exportResults = () => {
    if (results.length === 0) return;
    const content = results
      .map(r => `[Página ${r.page}] ${r.snippet}`)
      .join('\n\n');
    const header = `Búsqueda: "${query}"\n${results.length} resultados\n${'─'.repeat(40)}\n\n`;
    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `busqueda-${query.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return (
    <div className="absolute top-0 right-0 left-0 bg-card border-b shadow-lg z-20 max-h-[70vh] flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex-1 flex gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar en el documento..."
            className="h-8 text-sm"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={searching || !query.trim()} className="h-8 shrink-0">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
          </Button>
        </form>
        {results.length > 0 && (
          <Button variant="ghost" size="icon" onClick={exportResults} className="h-8 w-8 shrink-0" title="Exportar resultados a TXT">
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {searched && (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {searching ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Buscando en todas las páginas...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-border">
              <div className="px-3 py-2 text-xs text-muted-foreground bg-secondary/30 sticky top-0">
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(r.page)}
                  className="w-full text-left px-3 py-2.5 hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-xs font-semibold text-primary">Página {r.page}</span>
                  <p
                    className="text-sm text-muted-foreground mt-0.5 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: r.snippet.replace(
                        new RegExp(`(${escapeRegex(query)})`, 'gi'),
                        '<mark>$1</mark>'
                      ),
                    }}
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center p-8">
              No se encontraron resultados para "<span className="font-medium">{query}</span>"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

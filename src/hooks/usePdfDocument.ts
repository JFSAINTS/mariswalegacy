import { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface OutlineItem {
  title: string;
  dest: any;
  items: OutlineItem[];
}

export interface SearchResult {
  page: number;
  snippet: string;
}

export function usePdfDocument(url: string) {
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const pdfRef = useRef<any>(null);
  const textCache = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const doc = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        pdfRef.current = doc;
        setNumPages(doc.numPages);

        try {
          const ol = await doc.getOutline();
          if (ol && !cancelled) {
            setOutline(ol as unknown as OutlineItem[]);
          }
        } catch {
          // PDF might not have outline
        }

        setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Error al cargar el PDF');
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [url]);

  const renderPage = useCallback(async (
    pageNum: number,
    canvas: HTMLCanvasElement,
    scale: number
  ) => {
    const doc = pdfRef.current;
    if (!doc) return;
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
  }, []);

  const getPageText = useCallback(async (pageNum: number): Promise<string> => {
    if (textCache.current.has(pageNum)) return textCache.current.get(pageNum)!;
    const doc = pdfRef.current;
    if (!doc) return '';
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(' ');
    textCache.current.set(pageNum, text);
    return text;
  }, []);

  const searchAllPages = useCallback(async (query: string): Promise<SearchResult[]> => {
    const doc = pdfRef.current;
    if (!doc || !query.trim()) return [];
    const results: SearchResult[] = [];
    const q = query.toLowerCase();

    for (let i = 1; i <= doc.numPages; i++) {
      const text = await getPageText(i);
      const lower = text.toLowerCase();
      let idx = lower.indexOf(q);
      while (idx !== -1) {
        const start = Math.max(0, idx - 50);
        const end = Math.min(text.length, idx + query.length + 50);
        const snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
        results.push({ page: i, snippet });
        idx = lower.indexOf(q, idx + query.length);
      }
    }
    return results;
  }, [getPageText]);

  const resolveDestination = useCallback(async (dest: any): Promise<number | null> => {
    const doc = pdfRef.current;
    if (!doc || !dest) return null;
    try {
      let resolved = dest;
      if (typeof dest === 'string') {
        resolved = await doc.getDestination(dest);
      }
      if (resolved && resolved[0]) {
        const pageIdx = await doc.getPageIndex(resolved[0]);
        return pageIdx + 1;
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  const getPageViewport = useCallback(async (pageNum: number, scale: number) => {
    const doc = pdfRef.current;
    if (!doc) return null;
    const page = await doc.getPage(pageNum);
    return page.getViewport({ scale });
  }, []);

  const getPageAnnotations = useCallback(async (pageNum: number) => {
    const doc = pdfRef.current;
    if (!doc) return [];
    const page = await doc.getPage(pageNum);
    const annotations = await page.getAnnotations();
    return annotations.filter((a: any) => a.subtype === 'Link' && a.url);
  }, []);

  const getPageTextContent = useCallback(async (pageNum: number) => {
    const doc = pdfRef.current;
    if (!doc) return null;
    const page = await doc.getPage(pageNum);
    return await page.getTextContent();
  }, []);

  return {
    numPages, loading, error, outline,
    renderPage, getPageText, searchAllPages, resolveDestination, getPageViewport, getPageAnnotations, getPageTextContent,
  };
}

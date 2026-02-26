import { useRef, useEffect, useState, useCallback } from 'react';

interface Props {
  renderPage: (pageNum: number, canvas: HTMLCanvasElement, scale: number) => Promise<any>;
  getPageViewport: (pageNum: number, scale: number) => Promise<any>;
  pageNumber: number;
  zoom: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function PdfCanvas({ renderPage, getPageViewport, pageNumber, zoom, onSwipeLeft, onSwipeRight }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      setRendering(true);
      try {
        const viewport = await getPageViewport(pageNumber, 1);
        if (!viewport || cancelled) return;

        const containerWidth = container.clientWidth - 32;
        const baseScale = Math.min(containerWidth / viewport.width, 1.5);
        const finalScale = baseScale * zoom;
        const dpr = window.devicePixelRatio || 1;

        await renderPage(pageNumber, canvas, finalScale * dpr);

        canvas.style.width = `${viewport.width * finalScale}px`;
        canvas.style.height = `${viewport.height * finalScale}px`;
      } catch (e) {
        console.error('Render error:', e);
      }
      if (!cancelled) setRendering(false);
    };
    render();
    return () => { cancelled = true; };
  }, [renderPage, getPageViewport, pageNumber, zoom]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = touchStart.current.x - endX;
    const diffY = Math.abs(touchStart.current.y - endY);

    if (Math.abs(diffX) > 60 && diffY < 80) {
      if (diffX > 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }
    touchStart.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto flex items-start justify-center p-4 bg-secondary/30 scrollbar-thin"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className={`shadow-xl rounded-sm transition-opacity duration-200 ${rendering ? 'opacity-50' : 'opacity-100'}`}
      />
    </div>
  );
}

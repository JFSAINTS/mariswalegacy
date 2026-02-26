import { useRef, useEffect, useState, useCallback } from 'react';

interface Props {
  renderPage: (pageNum: number, canvas: HTMLCanvasElement, scale: number) => Promise<any>;
  getPageViewport: (pageNum: number, scale: number) => Promise<any>;
  pageNumber: number;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function PdfCanvas({ renderPage, getPageViewport, pageNumber, zoom, onZoomChange, onSwipeLeft, onSwipeRight }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);

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

        // Fit page fully inside container (both width and height)
        const containerWidth = container.clientWidth - 32;
        const containerHeight = container.clientHeight - 32;
        const scaleW = containerWidth / viewport.width;
        const scaleH = containerHeight / viewport.height;
        const baseScale = Math.min(scaleW, scaleH);
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

  // Swipe for page navigation (single finger)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    // Pinch-to-zoom (two fingers)
    if (e.touches.length === 2) {
      touchStart.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
      pinchStartZoom.current = zoom;
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current && onZoomChange) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / pinchStartDist.current;
      const newZoom = Math.min(4, Math.max(0.5, pinchStartZoom.current * scale));
      onZoomChange(Math.round(newZoom * 20) / 20); // snap to 5% increments
    }
  }, [onZoomChange]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (pinchStartDist.current) {
      pinchStartDist.current = null;
      return;
    }
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

  // Mouse wheel zoom (desktop)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!onZoomChange) return;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(4, Math.max(0.5, zoom + delta));
      onZoomChange(Math.round(newZoom * 20) / 20);
    }
  }, [zoom, onZoomChange]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto flex items-center justify-center p-4 bg-secondary/30 scrollbar-thin"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        className={`shadow-xl rounded-sm transition-opacity duration-200 ${rendering ? 'opacity-50' : 'opacity-100'}`}
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';

export interface Bookmark {
  id: string;
  page: number;
  title: string;
  createdAt: number;
}

const STORAGE_KEY = 'pdf-reader-bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = useCallback((page: number, title?: string) => {
    const bm: Bookmark = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      page,
      title: title || `Página ${page}`,
      createdAt: Date.now(),
    };
    setBookmarks(prev => [...prev, bm]);
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBookmark = useCallback((id: string, title: string) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, title } : b));
  }, []);

  const isBookmarked = useCallback((page: number) => {
    return bookmarks.some(b => b.page === page);
  }, [bookmarks]);

  const toggleBookmark = useCallback((page: number) => {
    const existing = bookmarks.find(b => b.page === page);
    if (existing) {
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
    } else {
      addBookmark(page);
    }
  }, [bookmarks, addBookmark]);

  return { bookmarks, addBookmark, removeBookmark, updateBookmark, isBookmarked, toggleBookmark };
}

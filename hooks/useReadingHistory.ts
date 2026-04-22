import { useState, useEffect, useCallback } from 'react';

export interface ReadingHistory {
  novelId: string;
  chapterId: string;
  scrollY: number;
  title: string;
  progress: number;
}

export function useReadingHistory(novelId?: string) {
  const [history, setHistory] = useState<ReadingHistory | null>(null);

  useEffect(() => {
    try {
      const storageKey = novelId ? `novel_history_${novelId}` : 'last_read';
      const saved = localStorage.getItem(storageKey);
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, [novelId]);

  const saveHistory = useCallback((nId: string, chapterId: string, scrollY: number, title: string, progress: number) => {
    const entry = { novelId: nId, chapterId, scrollY, title, progress };
    
    localStorage.setItem(`novel_history_${nId}`, JSON.stringify(entry));
    localStorage.setItem('last_read', JSON.stringify(entry));
    
    setHistory(entry);
  }, []);

  return { history, saveHistory };
}

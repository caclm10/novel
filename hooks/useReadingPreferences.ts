import { useState, useEffect } from 'react';

export interface ReadingPrefs {
  fontSize: number;
  lineSpacing: number;
}

export function useReadingPreferences() {
  const [prefs, setPrefs] = useState<ReadingPrefs>({ fontSize: 18, lineSpacing: 1.7 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('reader_prefs');
      if (saved) {
         setPrefs(JSON.parse(saved));
      }
    } catch {}
    setIsLoaded(true);
  }, []);

  const updatePrefs = (newPrefs: Partial<ReadingPrefs>) => {
    setPrefs(prev => {
       const updated = { ...prev, ...newPrefs };
       localStorage.setItem('reader_prefs', JSON.stringify(updated));
       return updated;
    });
  };

  return { prefs, updatePrefs, isLoaded };
}

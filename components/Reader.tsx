"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Chapter, Novel } from '../types/novel';
import { ChevronLeft, Settings2, List, Type, Sun, Moon, Coffee } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReadingPreferences } from '../hooks/useReadingPreferences';
import { useReadingHistory } from '../hooks/useReadingHistory';
import { client } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite/config';

interface ReaderProps {
  chapter: Chapter;
  novel: Novel;
}

export default function Reader({ chapter, novel }: ReaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  const { prefs, updatePrefs } = useReadingPreferences();
  const { saveHistory } = useReadingHistory();

  // Real-time state
  const [liveContent, setLiveContent] = useState(chapter.content || '');

  useEffect(() => {
    const channel = `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.chaptersTableId}.documents.${chapter.id}`;
    const unsubscribe = client.subscribe(channel, (response: any) => {
      if (response.payload && response.payload.content !== undefined) {
         setLiveContent(response.payload.content);
      }
    });

    return () => unsubscribe();
  }, [chapter.id]);

  // state for UI interactions
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  
  // flattening chapters to enable next/prev logical mapping
  const flatChapters = novel.volumes.flatMap(v => v.chapters);
  const currentIndex = flatChapters.findIndex(c => c.id === chapter.id);
  const totalChapters = flatChapters.length;
  const readingProgress = ((currentIndex + 1) / totalChapters) * 100;
  
  // gesture tracking for double tap
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const historyStr = localStorage.getItem('last_read');
    let startingScrollY = 0;
    
    if (historyStr) {
      const h = JSON.parse(historyStr);
      if (h.chapterId === chapter.id && h.scrollY > 0) {
         startingScrollY = h.scrollY;
      }
    }
    window.scrollTo(0, startingScrollY);
    
    // Simpan history seketika agar tidak perlu menunggu scroll dulu
    saveHistory(novel.id, chapter.id, startingScrollY, chapter.title, readingProgress);
  }, [chapter.id, novel.id, chapter.title, readingProgress, saveHistory]);

  useEffect(() => {
    const handleScroll = () => {
       saveHistory(novel.id, chapter.id, window.scrollY, chapter.title, readingProgress);
    };
    let timeout: NodeJS.Timeout;
    const throttledScroll = () => {
       if (timeout) clearTimeout(timeout);
       timeout = setTimeout(handleScroll, 500); 
    };
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [novel.id, chapter.id, chapter.title, readingProgress, saveHistory]);

  // Handle Double Tap for full screen & Single Tap for bottom sheet
  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (showBottomSheet) return;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;
    
    if (tapLength < 300 && tapLength > 0) {
      setIsFullscreen(!isFullscreen);
      setShowBottomSheet(false);
    } else {
      let clientY = 0;
      let innerHeight = window.innerHeight;
      
      if ('changedTouches' in e) {
         clientY = e.changedTouches[0].clientY;
      } else {
         clientY = (e as React.MouseEvent).clientY;
      }
      
      if (clientY > innerHeight * 0.75) {
         setTimeout(() => {
            const timeSinceTap = new Date().getTime() - currentTime;
            if (timeSinceTap >= 300) {
                setShowBottomSheet(true);
            }
         }, 300);
      }
    }
    lastTapRef.current = currentTime;
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      if (currentIndex < flatChapters.length - 1) {
        router.push(`/novel/${novel.id}/chapter/${flatChapters[currentIndex + 1].id}`);
      } else {
        // Last chapter => back to details/TOC
        router.push(`/novel/${novel.id}`);
      }
    } else if (swipe > swipeConfidenceThreshold) {
      if (currentIndex > 0) {
        router.push(`/novel/${novel.id}/chapter/${flatChapters[currentIndex - 1].id}`);
      }
    }
  };

  return (
    <div className={`relative min-h-screen bg-background text-foreground/90 transition-colors duration-500 overflow-hidden font-heading`}>
      {/* Top Navbar / Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out bg-background/80 backdrop-blur-md border-b border-border/50
          ${isFullscreen ? '-translate-y-full' : 'translate-y-0'}
        `}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <Link 
            href={`/novel/${novel.id}`}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground flex items-center justify-center rounded-full active:bg-secondary transition-colors"
            aria-label="Kembali ke Daftar Isi"
          >
            <ChevronLeft size={24} />
          </Link>
          
          <div className="flex-1 text-center truncate px-2">
            <span className="font-medium text-[13px] text-muted-foreground truncate block">
              {novel.title}
            </span>
          </div>

          <button 
            onClick={() => setShowBottomSheet(true)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full active:bg-secondary transition-colors"
            aria-label="Pengaturan Baca"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </header>

      {/* Reader Content - AnimatePresence ensures swiping transitions */}
      <div 
        className="h-full w-full absolute inset-0 overflow-y-auto overflow-x-hidden pt-16 pb-20"
        onTouchEnd={handleTouchEnd}
        onClick={handleTouchEnd}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.main 
            key={chapter.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4} 
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`px-5 md:px-12 max-w-2xl mx-auto selection:bg-primary/20 transition-all duration-300 ${isFullscreen ? 'pt-8 pb-12' : 'pt-4 pb-24'}`}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 leading-tight text-foreground">
              {chapter.title}
            </h1>
            
            <div 
              className="font-heading opacity-90 whitespace-pre-wrap tracking-wide editor-content prose-invert prose-p:my-2 prose-h1:text-2xl prose-h2:text-xl"
              style={{ 
                lineHeight: prefs.lineSpacing,
                fontSize: `${prefs.fontSize}px` 
              }}
              dangerouslySetInnerHTML={{ __html: liveContent }}
            />
            
            <div className="mt-16 text-center text-xs text-muted-foreground uppercase tracking-widest font-sans">
              ♦ ♦ ♦
              {currentIndex === flatChapters.length - 1 && (
                <div className="mt-4 pb-8"><span className="px-4 py-2 border border-border/50 rounded-full display-inline-block">Tamat. Kembali ke Menu</span></div>
              )}
            </div>
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Bottom Sheet Menu */}
      <AnimatePresence>
        {showBottomSheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBottomSheet(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[1px]"
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 50) setShowBottomSheet(false);
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] font-sans"
            >
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto my-3" />
              
              <div className="px-6 pb-8 pt-2">
                <div className="mb-6">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                     <span>Bab {currentIndex + 1}</span>
                     <span>{Math.round(readingProgress)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-300" 
                      style={{ width: `${readingProgress}%` }} 
                    />
                  </div>
                </div>

                {/* Sliders */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                     <span>Ukuran Font</span>
                     <span>{prefs.fontSize}px</span>
                  </div>
                  <input type="range" min="14" max="32" value={prefs.fontSize} onChange={(e) => updatePrefs({fontSize: parseInt(e.target.value)})} className="w-full accent-primary" />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                     <span>Jarak Baris</span>
                     <span>{prefs.lineSpacing}</span>
                  </div>
                  <input type="range" min="1.2" max="2.4" step="0.1" value={prefs.lineSpacing} onChange={(e) => updatePrefs({lineSpacing: parseFloat(e.target.value)})} className="w-full accent-primary" />
                </div>

                <div className="flex items-center justify-between text-foreground/80">
                  <Link href={`/novel/${novel.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl active:bg-secondary hover:bg-secondary/50 transition-colors">
                    <List size={22} className="text-foreground" />
                    <span className="text-[10px]">Daftar Isi</span>
                  </Link>
                  
                  <div className="w-px h-10 bg-border/50 mx-2" />
                  
                  <button onClick={() => setTheme('light')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl active:bg-secondary hover:bg-secondary/50 transition-colors ${theme === 'light' ? 'text-primary bg-secondary' : ''}`}>
                    <Sun size={22} />
                    <span className="text-[10px]">Terang</span>
                  </button>

                  <button onClick={() => setTheme('sepia')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl active:bg-secondary hover:bg-secondary/50 transition-colors ${theme === 'sepia' ? 'text-orange-600 dark:text-orange-400 bg-secondary' : ''}`}>
                    <Coffee size={22} />
                    <span className="text-[10px]">Sepia</span>
                  </button>

                  <button onClick={() => setTheme('dark')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl active:bg-secondary hover:bg-secondary/50 transition-colors ${theme === 'dark' ? 'text-primary bg-secondary' : ''}`}>
                    <Moon size={22} />
                    <span className="text-[10px]">Gelap</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

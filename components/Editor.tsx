"use client";

import React from 'react';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Chapter, Novel } from '../types/novel';
import { ChevronLeft, Check, Bold, Italic, Heading1, Heading2, Cloud, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { upsertChapter } from '@/actions/chapter';
import { databases } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite/config';
import { toast } from "sonner";

const ContentEditableBlock = React.memo(
  React.forwardRef<HTMLDivElement, { initialHtml: string; onInput: (html: string) => void; onKeyDown?: (e: React.KeyboardEvent) => void }>(
    ({ initialHtml, onInput, onKeyDown }, ref) => {
      return (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onInput(e.currentTarget.innerHTML)}
          onKeyDown={onKeyDown}
          className="w-full h-full min-h-[50vh] outline-none font-sans text-lg md:text-xl leading-[1.8] text-foreground/90 whitespace-pre-wrap break-words"
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: initialHtml }}
        />
      );
    }
  ),
  () => true // Mencegah komparasi ulang dari React agaar kursor tidak ter-reset
);

interface EditorProps {
  initialChapter: Chapter;
  novelId: string;
}

export default function Editor({ initialChapter, novelId }: EditorProps) {
  const router = useRouter();
  
  // Data state
  const [content, setContent] = useState(initialChapter.content || '');
  const [wordCount, setWordCount] = useState(0);
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'Tersimpan' | 'Menunggu' | 'Menyinkronkan paragraf...' | 'Semua tersimpan di Cloud' | 'Gagal Simpan'>('Tersimpan');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Floating Toolbar state
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }, []);

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
  }, [content]);

  const saveToAppwrite = async (html: string) => {
    if (!isOnline) {
       setSaveStatus('Gagal Simpan');
       return;
    }
    setSaveStatus('Menyinkronkan paragraf...');
    try {
      await upsertChapter(initialChapter.id, html); // Fallback to Server Action just in case
      await databases.updateDocument(
         appwriteConfig.databaseId,
         appwriteConfig.chaptersTableId,
         initialChapter.id,
         { content: html }
      );
      setSaveStatus('Semua tersimpan di Cloud'); 
    } catch (err) {
      console.error("Failed to save to Appwrite", err);
      setSaveStatus('Gagal Simpan');
      toast.error("Gagal sinkronisasi dengan Cloud.");
    }
  };

  // Debounced Auto-Save
  const handleInput = useCallback((html: string) => {
    setContent(html);
    setSaveStatus('Menunggu');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      saveToAppwrite(html);
    }, 3000);
  }, [initialChapter.id, novelId, isOnline]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTimeout(() => {
         if (editorRef.current) saveToAppwrite(editorRef.current.innerHTML);
      }, 50);
    }
  }, [initialChapter.id, isOnline]);

  // Handle Text Selection for Floating Toolbar
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
      setToolbarPos(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Pastikan seleksi terjadi di dalam editor box
    if (editorRef.current?.contains(selection.anchorNode)) {
       // Hitung posisi tengah di atas teks yang diseleksi (memperhitungkan scroll offset vertikal layar)
       const top = rect.top + window.scrollY - 50; 
       const left = rect.left + window.scrollX + (rect.width / 2);
       setToolbarPos({ top, left });
    } else {
       setToolbarPos(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [handleSelection]);

  // Formatting Actions
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    // paksa pemicu event input manual agar state terupdate
    if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
    }
    // pertahankan fokus
    editorRef.current?.focus();
  };

  // Tandai selesai
  const handleFinish = () => {
     toast.success("Bab selesai ditulis!");
     router.push(`/novel/${novelId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative selection:bg-primary/20">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => router.push(`/novel/${novelId}`)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full"
            aria-label="Kembali"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex-1 px-4 truncate flex items-center justify-center gap-2">
            <span className="font-semibold text-sm truncate">{initialChapter.title}</span>
            {/* Status Menyimpan */}
            <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors
              ${!isOnline ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                (saveStatus === 'Tersimpan' || saveStatus === 'Semua tersimpan di Cloud') ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                saveStatus === 'Menyinkronkan paragraf...' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                saveStatus === 'Menunggu' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                'bg-red-500/10 text-red-500 border-red-500/20'}
            `}>
              {!isOnline ? <WifiOff size={10} /> : <Cloud size={10} />}
              {!isOnline ? 'Offline' : saveStatus}
            </span>
          </div>

          <button 
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-3 py-1.5 -mr-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-semibold shadow-sm transition-transform active:scale-95"
            aria-label="Tandai Selesai"
          >
            Selesai <Check size={14} />
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="max-w-3xl mx-auto px-5 pt-8 w-full h-full pb-[40vh]">
        {/*
          Menggunakan versi Memoized agar statenya terpisah dari life-cycle React 
          yang bisa mereset cursor dan selection pengguna
        */}
        <ContentEditableBlock 
          key={initialChapter.id}
          ref={editorRef}
          initialHtml={initialChapter.content || ''}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />
      </main>

      {/* Floating Formatting Toolbar */}
      <AnimatePresence>
        {toolbarPos && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bg-[#121212] backdrop-blur-xl border border-neutral-800 shadow-2xl rounded-xl p-1.5 flex items-center gap-1 -translate-x-1/2"
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
          >
            <button onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 active:scale-95 transition-all">
              <Bold size={16} />
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 active:scale-95 transition-all">
              <Italic size={16} />
            </button>
            <div className="w-px h-5 bg-neutral-800 mx-1" />
            <button onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'H1'); }} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 active:scale-95 transition-all">
              <Heading1 size={16} />
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); applyFormat('formatBlock', 'H2'); }} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 active:scale-95 transition-all">
              <Heading2 size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Nav Info (Word Counter) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none flex auto-justify-center">
         <div className="mx-auto bg-background/80 backdrop-blur-md border border-border/50 px-4 py-1.5 rounded-full shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest pointer-events-auto">
              {wordCount} Kata
            </span>
         </div>
      </div>

    </div>
  );
}

"use client";

import { Novel } from '../types/novel';
import { BookOpen, ChevronLeft, ChevronRight, PenLine, Plus, Trash2, Image as ImageIcon, Upload, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createVolume, updateNovel, updateNovelCover, uploadNovelCover } from '../actions/novel';
import { createChapter, deleteChapter } from '../actions/chapter';
import { useRef, useState } from 'react';
import { useReadingHistory } from '../hooks/useReadingHistory';

interface TableOfContentsProps {
  novel: Novel;
}

export default function TableOfContents({ novel }: TableOfContentsProps) {
  const { history: specificHistory } = useReadingHistory(novel.id);

  const totalChapters = novel.volumes.reduce((acc, vol) => acc + vol.chapters.length, 0);
  let totalWords = 0;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  novel.volumes.forEach(vol => {
    vol.chapters.forEach(ch => {
      totalWords += (ch.content || '').trim().split(/\s+/).filter(w => w.length > 0).length;
    });
  });

  const handleAddVolume = async () => {
    const title = window.prompt("Nama Volume/Arc Baru (Misal: 'Bagian 1: Permulaan'):");
    if (title) await createVolume(novel.id, title);
  };

  const handleAddChapter = async (volumeId: string) => {
    const title = window.prompt("Masukkan Judul Bab Baru:");
    if (title) await createChapter(volumeId, title, novel.id);
  };

  const handleDeleteChapter = async (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();
    if (window.confirm("Menghapus bab ini akan menghilangkan konten tulisannya selamanya. Lanjutkan?")) {
       await deleteChapter(chapterId, novel.id);
    }
  };

  const handleEditNovel = async () => {
    const newTitle = window.prompt("Ubah Judul Novel:", novel.title);
    if (!newTitle) return;
    const newAuthor = window.prompt("Ubah Nama Penulis:", novel.author);
    if (!newAuthor) return;
    
    if (newTitle !== novel.title || newAuthor !== novel.author) {
      await updateNovel(novel.id, newTitle, newAuthor);
    }
  };

  const handleEditCover = async () => {
    const newCover = window.prompt("Masukkan URL gambar eksternal untuk sampul baru:");
    if (newCover === null) return; 
    if (newCover.trim() === '') {
       await updateNovelCover(novel.id, null);
    } else {
       await updateNovelCover(novel.id, newCover);
    }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      await uploadNovelCover(novel.id, formData);
    } catch (err) {
      console.error("Gagal mengunggah", err);
      alert("Gagal mengunggah gambar!");
    } finally {
      setIsUploading(false);
      // Reset input file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    if (window.confirm("Beneran ingin menghapus gambar sampul buku ini?")) {
       await updateNovelCover(novel.id, null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center px-4 h-14">
          <Link 
            href="/"
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors active:scale-95 flex items-center justify-center"
            aria-label="Kembali ke Rak Buku"
          >
            <ChevronLeft size={24} />
          </Link>
          <div className="flex-1 ml-2 text-center mr-10 relative">
             <h1 className="font-semibold text-sm truncate">{novel.title}</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="px-6 py-6 pb-8 border-b border-border/20 bg-card/30">
        <div className="flex flex-col md:flex-row gap-6 w-full items-start md:items-end">
          <div className="relative group/cover aspect-[2/3] w-32 md:w-48 shrink-0 rounded-xl overflow-hidden shadow-lg border border-border/50 bg-muted cursor-pointer">
            {novel.coverImage ? (
              <img src={novel.coverImage} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                <span className="text-muted-foreground font-semibold text-2xl">{novel.title.charAt(0)}</span>
              </div>
            )}
            
            <input 
               type="file" 
               accept="image/*" 
               className="hidden" 
               ref={fileInputRef} 
               onChange={handleUploadCover} 
               disabled={isUploading}
            />

            {/* Overlay Cover Editor */}
            <div className={`absolute inset-0 bg-black/70 flex-col items-center justify-center gap-2 p-2 backdrop-blur-sm transition-opacity duration-300 flex ${isUploading ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}>
                {isUploading ? (
                  <span className="text-white text-xs font-semibold animate-pulse">Mengunggah...</span>
                ) : (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-primary text-primary-foreground p-2 text-xs rounded-md shadow flex items-center gap-1.5 hover:bg-primary/90 w-full justify-center transition-transform active:scale-95 border border-primary/50">
                      <Upload size={14} /> Unggah File 
                    </button>
                    <button onClick={handleEditCover} className="bg-secondary/80 text-foreground p-1.5 text-[11px] rounded-md shadow flex items-center gap-1.5 hover:bg-secondary w-full justify-center transition-transform active:scale-95">
                      <ImageIcon size={12} /> Atau pakai URL
                    </button>
                    {novel.coverImage && (
                      <button onClick={handleRemoveCover} className="bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white p-2 text-xs rounded-md shadow flex items-center gap-1.5 w-full justify-center transition-colors active:scale-95 mt-1">
                        <Trash2 size={14} /> Hapus
                      </button>
                    )}
                  </>
                )}
            </div>
          </div>
          
          <div className="pb-1 group/header flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1 leading-snug">{novel.title}</h2>
                <div className="text-sm text-muted-foreground mb-4">
                  Oleh: {novel.author} 
                </div>
              </div>
              <button 
                onClick={handleEditNovel} 
                className="p-2 ml-4 text-muted-foreground hover:bg-secondary/80 hover:text-foreground rounded-full transition-colors active:scale-95 flex items-center gap-2 text-xs opacity-80"
                title="Edit Identitas Novel"
              >
                <PenLine size={14} /> Edit
              </button>
            </div>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5"><BookOpen size={14} /> {totalChapters} Bab ({totalWords.toLocaleString()} Kata)</span>
            </div>
            
            {specificHistory && (
               <Link href={`/novel/${novel.id}/chapter/${specificHistory.chapterId}`} className="block w-full sm:w-fit py-2.5 px-6 bg-primary text-primary-foreground text-[13px] font-semibold rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] border border-primary-foreground/10 flex items-center justify-center gap-2">
                 <PlayCircle size={18} /> Lanjutkan: {specificHistory.title}
               </Link>
            )}
          </div>
        </div>
        
        <button 
           onClick={handleAddVolume}
           className="mt-8 w-full block py-4 border-2 border-dashed border-border/70 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all outline-none active:scale-[0.98] font-medium flex items-center justify-center gap-2"
        >
           <Plus size={18} /> Tambah Volume Baru
        </button>
      </div>

      {/* Chapters List */}
      <main className="px-4 py-4 pt-6 space-y-8">
        {novel.volumes.map((vol, volIdx) => (
          <div key={volIdx} className="space-y-3">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground px-2">
              {vol.title}
            </h3>
            
            <div className="divide-y divide-border/50">
                {vol.chapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between p-2 pl-4 hover:bg-muted/30 transition-colors group">
                    <Link 
                      href={`/novel/${novel.id}/chapter/${chapter.id}`}
                      className="flex-1 flex items-center py-2 min-w-0"
                    >
                      <span className="text-[15px] text-foreground font-medium truncate pr-4">
                        {chapter.title}
                      </span>
                    </Link>
                    
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                      <Link 
                        href={`/novel/${novel.id}/edit/${chapter.id}`}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors active:scale-95"
                        title="Edit Konten"
                      >
                        <PenLine size={16} />
                      </Link>
                      <button 
                        onClick={(e) => handleDeleteChapter(e, chapter.id)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors active:scale-95"
                        title="Hapus Bab"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => handleAddChapter(vol.id)}
                  className="w-full flex items-center gap-2 p-4 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors"
                >
                  <Plus size={16} /> Tambah Bab
                </button>
              </div>
          </div>
        ))}
      </main>
    </div>
  );
}

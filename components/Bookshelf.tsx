"use client";

import { Novel } from '../types/novel';
import Link from 'next/link';
import { useReadingHistory } from '../hooks/useReadingHistory';
import { Download, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { createNovel, deleteNovel } from '../actions/novel';

interface BookshelfProps {
  novels: Novel[];
}

export default function Bookshelf({ novels }: BookshelfProps) {
  const { history } = useReadingHistory();

  const handleBackup = () => {
     try {
       const data = {
          drafts: JSON.parse(localStorage.getItem('novel_drafts') || '{}'),
          prefs: JSON.parse(localStorage.getItem('reader_prefs') || '{}'),
          history: JSON.parse(localStorage.getItem('last_read') || 'null')
       };
       const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `digital-binder-backup-${new Date().toISOString().split('T')[0]}.json`;
       a.click();
       URL.revokeObjectURL(url);
     } catch(e) {
       console.error("Backup failed", e);
     }
  };

  const handleCreateNovel = async () => {
    const title = window.prompt("Masukkan Judul Novel Baru:");
    if (!title) return;
    const author = window.prompt("Masukkan Nama Penulis:");
    if (!author) return;
    
    await createNovel(title, author);
  };

  const handleDeleteNovel = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (window.confirm("Apakah Anda yakin ingin menghapus novel ini selamanya secara permanen?")) {
      await deleteNovel(id);
      
      // Cleanup history if currently reading this novel
      if (history?.novelId === id) {
         localStorage.removeItem('last_read');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-8">
      {/* Header */}
      <header className="px-6 py-8 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rak Buku</h1>
          <p className="text-muted-foreground mt-1 text-sm">Karya tulisanmu tersimpan di sini</p>
        </div>
        <button 
          onClick={handleBackup} 
          className="p-2.5 bg-muted hover:bg-muted/80 rounded-full text-foreground transition-all active:scale-95" 
          title="Backup Draf & Pengaturan"
        >
          <Download size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-8">
        
        {/* Continue Reading Hero Card */}
        {history && (
           <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex justify-between items-center mb-4 pl-2">
                 <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 border border-primary/20 bg-primary/10 px-2 py-0.5 rounded-md">
                   Lanjutkan Membaca
                 </span>
                 <span className="text-xs font-medium text-muted-foreground">{Math.round(history.progress)}% Selesai</span>
              </div>
              <div className="flex gap-4 items-center pl-2">
                 <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[17px] truncate pr-4 text-foreground/90">{history.title}</h3>
                 </div>
                 <Link 
                   href={`/novel/${history.novelId}/chapter/${history.chapterId}`} 
                   className="shrink-0 bg-primary text-primary-foreground p-3 rounded-full hover:scale-105 active:scale-95 transition-transform"
                 >
                    <PlayCircle size={22} className="ml-0.5" />
                 </Link>
              </div>
           </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <button onClick={handleCreateNovel} className="group relative aspect-[2/3] rounded-md border-2 border-dashed border-border/70 bg-card hover:bg-muted/50 flex flex-col items-center justify-center transition-all active:scale-95">
             <Plus size={32} className="text-muted-foreground group-hover:text-primary transition-colors mb-2" />
             <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">Buku Baru</span>
          </button>

          {novels.map((novel) => (
            <Link 
              href={`/novel/${novel.id}`} 
              key={novel.id} 
              className="group block"
              prefetch={true}
            >
              <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-shadow">
                {novel.coverImage ? (
                  <img src={novel.coverImage} alt={novel.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                    <span className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">{novel.title.charAt(0)}</span>
                  </div>
                )}
                
                <button 
                  onClick={(e) => handleDeleteNovel(e, novel.id)} 
                  className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 backdrop-blur-sm"
                  title="Hapus Novel"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              {/* Book Info */}
              <div className="mt-3 px-1">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
                  {novel.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {novel.author}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

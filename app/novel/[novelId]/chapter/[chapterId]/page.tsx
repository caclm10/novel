import { getNovelWithChapters } from '@/actions/novel';
import Reader from '@/components/Reader';
import { notFound } from 'next/navigation';

export default async function ChapterPage({ params }: { params: Promise<{ novelId: string, chapterId: string }> }) {
  const resolvedParams = await params;
  const novel = await getNovelWithChapters(resolvedParams.novelId);
  
  if (!novel) {
    notFound();
  }

  const chapter = novel.volumes.flatMap((v: any) => v.chapters).find((c: any) => c.id === resolvedParams.chapterId);

  if (!chapter) {
    notFound();
  }

  return (
    <main className="font-sans antialiased min-h-screen selection:bg-primary/20 bg-background text-foreground transition-colors duration-300">
      <Reader chapter={chapter as any} novel={novel as any} />
    </main>
  );
}

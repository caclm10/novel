import { getNovelWithChapters } from '@/actions/novel';
import TableOfContents from '@/components/TableOfContents';
import { notFound } from 'next/navigation';

export default async function NovelPage({ params }: { params: Promise<{ novelId: string }> }) {
  const resolvedParams = await params;
  const novel = await getNovelWithChapters(resolvedParams.novelId);
  
  if (!novel) {
    notFound();
  }

  return (
    <main className="font-sans antialiased min-h-screen selection:bg-primary/20 bg-background text-foreground transition-colors duration-300">
      <TableOfContents novel={novel as any} />
    </main>
  );
}

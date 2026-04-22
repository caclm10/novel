import { getNovels } from '@/actions/novel';
import Bookshelf from '@/components/Bookshelf';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const novels = await getNovels();

  return (
    <main className="font-sans antialiased min-h-screen selection:bg-primary/20 bg-background text-foreground transition-colors duration-300">
      <Bookshelf novels={novels as any} />
    </main>
  );
}

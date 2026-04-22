import { db } from './index';
import { novels, volumes, chapters } from './schema';
import { mockNovels } from '../data/mockData';

async function seed() {
  console.log('Seeding local mock data into SQLite...');
  
  // Clean up existing data to be safe during multiple runs
  await db.delete(novels);
  await db.delete(volumes);
  await db.delete(chapters);

  for (const novel of mockNovels) {
     await db.insert(novels).values({
        id: novel.id,
        title: novel.title,
        author: novel.author,
        description: null,
        coverImage: novel.coverImage,
     });

     let volumeOrder = 0;
     for (const vol of novel.volumes) {
        const volumeId = `${novel.id}-v${volumeOrder}`;
        await db.insert(volumes).values({
           id: volumeId,
           novelId: novel.id,
           title: vol.title,
           order: volumeOrder
        });

        let chapterOrder = 0;
        for (const ch of vol.chapters) {
           await db.insert(chapters).values({
              id: ch.id,
              volumeId: volumeId,
              title: ch.title,
              content: ch.content,
              status: ch.status === 'Draft' ? 'Draft' : 'Final',
              order: chapterOrder
           });
           chapterOrder++;
        }
        volumeOrder++;
     }
  }
  console.log('Database Seeding Completed!');
}

seed().catch(console.error);

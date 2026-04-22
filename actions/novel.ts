"use server";

import { db } from "../db";
import { novels, volumes, chapters } from "../db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

// Mengambil seluruh list novel untuk diletakkan di rak
export async function getNovels() {
  return await db.query.novels.findMany();
}

// Mengambil 1 novel beserta struktur komplit volume dan bab di dalamnya
export async function getNovelWithChapters(novelId: string) {
  const novel = await db.query.novels.findFirst({
    where: eq(novels.id, novelId),
    with: {
      volumes: {
        with: {
          chapters: {
             orderBy: (chapters: any, { asc }: any) => [asc(chapters.order)]
          }
        },
        orderBy: (volumes: any, { asc }: any) => [asc(volumes.order)]
      }
    }
  });
  return novel;
}

async function deleteLocalCoverImage(coverUrl: string | null | undefined) {
  if (!coverUrl || !coverUrl.startsWith('/uploads/')) return;
  try {
     const filePath = join(process.cwd(), 'public', coverUrl);
     await unlink(filePath);
  } catch(e) {
     console.error("Gagal menghapus gambar lama secara fisik", e);
  }
}

export async function deleteNovel(novelId: string) {
   const novel = await db.query.novels.findFirst({ where: eq(novels.id, novelId) });
   await deleteLocalCoverImage(novel?.coverImage);

   await db.delete(novels).where(eq(novels.id, novelId));
   revalidatePath('/');
   return { success: true };
}

export async function createNovel(title: string, author: string) {
  const id = `novel_${Date.now()}`;
  await db.insert(novels).values({
     id,
     title,
     author,
     coverImage: `https://picsum.photos/seed/${id}/400/600`
  });
  revalidatePath('/');
  return id;
}

export async function createVolume(novelId: string, title: string) {
  const id = `vol_${Date.now()}`;
  const existingVolumes = await db.query.volumes.findMany({ where: eq(volumes.novelId, novelId) });
  const order = existingVolumes.length;
  
  await db.insert(volumes).values({
     id,
     novelId,
     title,
     order
  });
  revalidatePath(`/novel/${novelId}`);
  return id;
}

export async function updateNovel(novelId: string, title: string, author: string) {
  await db.update(novels).set({ title, author }).where(eq(novels.id, novelId));
  revalidatePath('/');
  revalidatePath(`/novel/${novelId}`);
  return { success: true };
}

export async function updateNovelCover(novelId: string, coverImage: string | null) {
  const novel = await db.query.novels.findFirst({ where: eq(novels.id, novelId) });
  if (novel?.coverImage !== coverImage) {
      await deleteLocalCoverImage(novel?.coverImage);
  }

  await db.update(novels).set({ coverImage }).where(eq(novels.id, novelId));
  revalidatePath('/');
  revalidatePath(`/novel/${novelId}`);
  return { success: true };
}

export async function uploadNovelCover(novelId: string, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'No file provided' };

  const novel = await db.query.novels.findFirst({ where: eq(novels.id, novelId) });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  try {
     await mkdir(uploadDir, { recursive: true });
  } catch(e) {}
  
  const ext = file.name.split('.').pop() || 'png';
  const filename = `${novelId}-${Date.now()}.${ext}`;
  const filePath = join(uploadDir, filename);

  await writeFile(filePath, buffer);

  const publicUrl = `/uploads/${filename}`;

  // Bersihkan gambar lama di folder setelah sukses membuat yang baru
  await deleteLocalCoverImage(novel?.coverImage);

  await db.update(novels).set({ coverImage: publicUrl }).where(eq(novels.id, novelId));
  revalidatePath('/');
  revalidatePath(`/novel/${novelId}`);
  return { success: true, url: publicUrl };
}

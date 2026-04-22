"use server";

import { db } from "../db";
import { chapters } from "../db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function upsertChapter(chapterId: string, content: string, status?: 'Draft' | 'Final') {
  const updates: any = { content };
  if (status) updates.status = status;
  
  await db.update(chapters)
    .set(updates)
    .where(eq(chapters.id, chapterId));
  
  // Memberitahu Next.js bahwa cache halaman bacaan harus diperbaharui
  // revalidatePath('/'); 
  return { success: true };
}

export async function createChapter(volumeId: string, title: string, novelId: string) {
  const id = `ch_${Date.now()}`;
  const existingChapters = await db.query.chapters.findMany({ where: eq(chapters.volumeId, volumeId) });
  const order = existingChapters.length;

  await db.insert(chapters).values({
     id,
     volumeId,
     title,
     content: '<p>Tulis cerita bab ini di sini...</p>',
     order
  });
  revalidatePath(`/novel/${novelId}`);
  return id;
}

export async function deleteChapter(chapterId: string, novelId: string) {
  await db.delete(chapters).where(eq(chapters.id, chapterId));
  revalidatePath(`/novel/${novelId}`);
  return { success: true };
}

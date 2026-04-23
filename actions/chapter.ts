"use server";

import { revalidatePath } from "next/cache";
import { ID, Query, Databases } from "node-appwrite";
import { getSessionClient, getSessionUser } from "@/lib/appwrite/server";
import { appwriteConfig } from "@/lib/appwrite/config";

const getDatabases = async () => {
    const client = await getSessionClient();
    return new Databases(client);
}

export async function upsertChapter(chapterId: string, content: string) {
  const databases = await getDatabases();
  const updates: any = { content };
  
  await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.chaptersTableId,
      chapterId,
      updates
  );
  
  return { success: true };
}

export async function createChapter(volumeId: string, title: string, novelId: string) {
  const databases = await getDatabases();
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  
  const id = ID.unique();
  
  const existing = await databases.listDocuments(
      appwriteConfig.databaseId, appwriteConfig.chaptersTableId, [Query.equal('volumeId', volumeId)]
  );

  await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.chaptersTableId,
      id,
      {
         novelId,
         volumeId,
         title,
         content: '<p>Tulis cerita bab ini di sini...</p>',
         order: existing.total,
         userId: user.$id
      }
  );
  revalidatePath(`/novel/${novelId}`);
  return id;
}

export async function deleteChapter(chapterId: string, novelId: string) {
  const databases = await getDatabases();
  await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.chaptersTableId,
      chapterId
  );
  revalidatePath(`/novel/${novelId}`);
  return { success: true };
}

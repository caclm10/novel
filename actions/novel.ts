"use server";

import { revalidatePath } from "next/cache";
import { ID, Query, Databases, Storage } from "node-appwrite";
import { getSessionClient, getSessionUser } from "@/lib/appwrite/server";
import { appwriteConfig } from "@/lib/appwrite/config";

const getDatabases = async () => {
    const client = await getSessionClient();
    return new Databases(client);
}

function extractFileId(url: string | null) {
   if (!url || !url.includes(appwriteConfig.storageBucketId)) return null;
   const match = url.match(/\/files\/([a-zA-Z0-9_-]+)\/view/);
   return match ? match[1] : null;
}

// Mengambil seluruh list novel untuk diletakkan di rak
export async function getNovels() {
  const databases = await getDatabases();
  const user = await getSessionUser();
  if (!user) return [];

  try {
      const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.novelsTableId,
          [
             Query.equal('userId', user.$id),
             Query.orderDesc('$createdAt')
          ]
      );
      
      return response.documents.map(doc => ({
          id: doc.$id,
          title: doc.title,
          author: doc.author,
          coverImage: doc.coverImage || '',
          volumes: []
      }));
  } catch (e: any) {
      console.error("Gagal mengambil novel (mungkin masalah permission):", e.message);
      return [];
  }
}

// Mengambil 1 novel beserta struktur komplit volume dan bab di dalamnya
export async function getNovelWithChapters(novelId: string) {
  const databases = await getDatabases();

  // Ambil data novel
  const novelDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.novelsTableId,
      novelId
  );

  // Ambil volumes
  const volumesRes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.volumesTableId,
      [Query.equal('novelId', novelId), Query.orderAsc('order')]
  );

  // Ambil chapters
  const chaptersRes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.chaptersTableId,
      [Query.equal('novelId', novelId), Query.orderAsc('order')]
  );

  // Reconstruct hierarchy
  const volumes = volumesRes.documents.map(v => ({
      id: v.$id,
      title: v.title,
      order: v.order,
      chapters: chaptersRes.documents
         .filter(c => c.volumeId === v.$id)
         .map(c => ({
            id: c.$id,
            title: c.title,
            content: c.content,
            order: c.order
         }))
  }));

  return {
      id: novelDoc.$id,
      title: novelDoc.title,
      author: novelDoc.author,
      coverImage: novelDoc.coverImage || '',
      volumes
  };
}

export async function deleteNovel(novelId: string) {
   const databases = await getDatabases();
   
   // Ambil novel lama untuk menghapus gambarnya jika ada
   const novel = await databases.getDocument(appwriteConfig.databaseId, appwriteConfig.novelsTableId, novelId);
   const fileId = extractFileId(novel.coverImage);
   if (fileId) {
      try {
         const client = await getSessionClient();
         const storage = new Storage(client);
         await storage.deleteFile(appwriteConfig.storageBucketId, fileId);
      } catch (e) { console.error("Gagal hapus file cover dari storage", e); }
   }

   // Hapus Volumes
   const volumesRes = await databases.listDocuments(
      appwriteConfig.databaseId, appwriteConfig.volumesTableId, [Query.equal('novelId', novelId)]
   );
   for (const v of volumesRes.documents) {
      await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.volumesTableId, v.$id);
   }

   // Hapus Chapters
   const chaptersRes = await databases.listDocuments(
      appwriteConfig.databaseId, appwriteConfig.chaptersTableId, [Query.equal('novelId', novelId)]
   );
   for (const c of chaptersRes.documents) {
      await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.chaptersTableId, c.$id);
   }

   await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.novelsTableId, novelId);
   revalidatePath('/');
   return { success: true };
}

export async function createNovel(title: string, author: string) {
  const databases = await getDatabases();
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  const id = ID.unique();
  
  try {
      await databases.createDocument(
         appwriteConfig.databaseId,
         appwriteConfig.novelsTableId,
         id,
         {
            title,
            author,
            coverImage: `https://picsum.photos/seed/${id}/400/600`,
            userId: user.$id
         }
      );
  } catch (e: any) {
      console.log("=== DEBUG APPWRITE ERROR ===");
      console.log("Table ID yang dituju:", appwriteConfig.novelsTableId);
      console.log("Pesan Error:", e.message);
      throw e;
  }
  revalidatePath('/');
  return id;
}

export async function createVolume(novelId: string, title: string) {
  const databases = await getDatabases();
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  
  const id = ID.unique();
  
  const existing = await databases.listDocuments(
     appwriteConfig.databaseId, appwriteConfig.volumesTableId, [Query.equal('novelId', novelId)]
  );
  
  await databases.createDocument(
     appwriteConfig.databaseId,
     appwriteConfig.volumesTableId,
     id,
     {
        novelId,
        title,
        order: existing.total,
        userId: user.$id
     }
  );
  revalidatePath(`/novel/${novelId}`);
  return id;
}

export async function updateNovel(novelId: string, title: string, author: string) {
  const databases = await getDatabases();
  await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.novelsTableId,
      novelId,
      { title, author }
  );
  revalidatePath('/');
  revalidatePath(`/novel/${novelId}`);
  return { success: true };
}

export async function updateNovelCover(novelId: string, coverImage: string | null) {
  const databases = await getDatabases();

  // Hapus file lama di storage jika ada
  const oldNovel = await databases.getDocument(appwriteConfig.databaseId, appwriteConfig.novelsTableId, novelId);
  const oldFileId = extractFileId(oldNovel.coverImage);
  if (oldFileId) {
     try {
         const client = await getSessionClient();
         const storage = new Storage(client);
         await storage.deleteFile(appwriteConfig.storageBucketId, oldFileId);
     } catch (e) { console.error("Gagal hapus file cover lama", e); }
  }

  await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.novelsTableId,
      novelId,
      { coverImage: coverImage || '' }
  );
  revalidatePath('/');
  revalidatePath(`/novel/${novelId}`);
  return { success: true };
}

export async function uploadNovelCover(novelId: string, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) throw new Error("No file provided");

  const client = await getSessionClient();
  const databases = new Databases(client);
  const storage = new Storage(client);

  // Hapus gambar lama dulu jika ada
  const oldNovel = await databases.getDocument(appwriteConfig.databaseId, appwriteConfig.novelsTableId, novelId);
  const oldFileId = extractFileId(oldNovel.coverImage);
  if (oldFileId) {
     try {
         await storage.deleteFile(appwriteConfig.storageBucketId, oldFileId);
     } catch (e) { console.error("Gagal hapus file cover lama", e); }
  }

  const uploadedFile = await storage.createFile(
      appwriteConfig.storageBucketId,
      ID.unique(),
      file
  );

  const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.storageBucketId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;

  await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.novelsTableId,
      novelId,
      { coverImage: fileUrl }
  );
  
  revalidatePath('/');
  revalidatePath(`/novel/${novelId}`);
  return { success: true };
}

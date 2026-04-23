export const appwriteConfig = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
    novelsTableId: process.env.NEXT_PUBLIC_APPWRITE_NOVELS_TABLE_ID || '',
    volumesTableId: process.env.NEXT_PUBLIC_APPWRITE_VOLUMES_TABLE_ID || '',
    chaptersTableId: process.env.NEXT_PUBLIC_APPWRITE_CHAPTERS_TABLE_ID || '',
    storageBucketId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || ''
};

import { Client, Account } from 'node-appwrite';
import { appwriteConfig } from './config';
import { cookies } from 'next/headers';

// Admin client (reusable) - Requires APPWRITE_API_KEY in .env.local
export const getAdminClient = () => {
    return new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId)
        .setKey(process.env.APPWRITE_API_KEY || '');
};

export const getAdminAccount = () => {
    return new Account(getAdminClient());
}

// Session client (create per-request)
export const getSessionClient = async () => {
    const client = new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId);

    const cookieStore = await cookies();
    const session = cookieStore.get(`a_session_${appwriteConfig.projectId}`);

    if (session && session.value) {
        client.setSession(session.value);
    }

    return client;
};

export const getSessionAccount = async () => {
    const client = await getSessionClient();
    return new Account(client);
};

export const getSessionUser = async () => {
    try {
        const account = await getSessionAccount();
        return await account.get();
    } catch (e) {
        return null;
    }
}

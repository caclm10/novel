import { getSessionAccount } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const account = await getSessionAccount();
        await account.deleteSession('current');
    } catch (e) {
        console.error('Logout error', e);
    }

    const cookieStore = await cookies();
    cookieStore.delete(`a_session_${appwriteConfig.projectId}`);

    return NextResponse.json({ success: true });
}

"use server";

import { getAdminAccount } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';
import { cookies } from 'next/headers';

export async function verifyMagicUrl(userId: string, secret: string) {
    try {
        const account = getAdminAccount();
        const session = await account.updateMagicURLSession(userId, secret); 
        
        const cookieStore = await cookies();
        cookieStore.set(`a_session_${appwriteConfig.projectId}`, session.secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(session.expire),
            path: '/',
        });

        return { success: true };
    } catch (e: any) {
        console.error("Gagal verifikasi magic URL:", e.message);
        return { success: false, error: e.message };
    }
}

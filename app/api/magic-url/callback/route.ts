import { getAdminAccount } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (!userId || !secret) {
        return NextResponse.redirect(`${origin}/login?error=missing_credentials`);
    }

    try {
        const account = getAdminAccount();
        const session = await account.updateMagicURLSession(userId, secret); 
        
        const cookieStore = await cookies();
        cookieStore.set(`a_session_${appwriteConfig.projectId}`, session.secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(session.expire),
            path: '/',
        });

        return NextResponse.redirect(`${origin}/`);
    } catch (e) {
        console.error(e);
        return NextResponse.redirect(`${origin}/login?error=session_creation_failed`);
    }
}

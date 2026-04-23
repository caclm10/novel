import { getAdminAccount } from '@/lib/appwrite/server';
import { NextResponse } from 'next/server';
import { ID } from 'appwrite';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const origin = new URL(request.url).origin;
        const account = getAdminAccount();
        
        await account.createMagicURLToken(
            ID.unique(),
            email,
            `${origin}/api/magic-url/callback`
        );
        
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Failed to send magic URL' }, { status: 500 });
    }
}

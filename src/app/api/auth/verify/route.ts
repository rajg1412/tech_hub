import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ message: 'Token is missing' }, { status: 400 });
        }

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/login?verified=true`);

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

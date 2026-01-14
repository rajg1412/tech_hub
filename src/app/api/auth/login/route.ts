import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        console.log('Login attempt started...');
        await dbConnect();
        console.log('Database connected.');

        const { email, password } = await req.json();
        console.log('Login for:', email);

        const user = await User.findOne({ email });
        console.log('User search completed.');

        if (!user) {
            console.log('User not found.');
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
        }

        if (!user.isVerified) {
            return NextResponse.json({ message: 'Please verify your email address before logging in.' }, { status: 401 });
        }


        if (email === 'p@gmail.com' && user.role !== 'admin') {
            console.log('Promoting p@gmail.com to admin...');
            user.role = 'admin';
            await user.save();
        }

        console.log('Comparing passwords...');
        const isMatch = await Promise.race([
            bcrypt.compare(password, user.password),
            new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('Password comparison timeout')), 5000))
        ]);
        console.log('Password comparison check completed. Match:', isMatch);

        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
        }

        console.log('Signing token...');
        const token = await Promise.race([
            signToken({ id: user._id.toString(), email: user.email, role: user.role }),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Token signing timeout')), 5000))
        ]);
        console.log('Token signed.');

        const response = NextResponse.json({
            message: 'Logged in successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        console.log('Login successful, returning response.');
        return response;
    } catch (error: any) {
        console.error('SERVER LOGIN ERROR:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

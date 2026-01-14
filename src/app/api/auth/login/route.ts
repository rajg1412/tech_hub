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
        console.log('Login attempt for:', email);

        console.log('Searching for user in DB...');
        const user = await User.findOne({ email });
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('User not found in database.');
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 });
        }

        console.log('Comparing passwords with bcrypt...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            console.log('Password does not match.');
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 });
        }

        console.log('Generating JWT token...');
        const token = await signToken({ id: user._id.toString(), email: user.email, role: user.role });
        console.log('Token generated successfully.');

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

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Profile from '@/models/Profile';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();
        const usersWithProfiles = await Promise.all(users.map(async (user: any) => {
            const profile = await Profile.findOne({ userId: user._id }).lean();
            return { ...user, profile };
        }));

        return NextResponse.json(usersWithProfiles);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    try {
        await dbConnect();

        await User.findByIdAndDelete(id);
        await Profile.findOneAndDelete({ userId: id });

        return NextResponse.json({ message: 'User and profile deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    try {
        await dbConnect();
        const data = await req.json();

        // Update user
        const userData = { name: data.name, role: data.role, email: data.email };
        const user = await User.findByIdAndUpdate(id, userData, { new: true }).select('-password');

        // Update profile if data provided
        if (data.profile) {
            await Profile.findOneAndUpdate(
                { userId: id },
                { ...data.profile, userId: id },
                { upsert: true, new: true }
            );
        }

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

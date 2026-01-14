import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { name, email, password } = await req.json();

        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: email === 'p@gmail.com' ? 'admin' : 'user',
            isVerified: false,
            verificationToken
        });

        // Send Email if RESEND_API_KEY exists
        if (process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

                await resend.emails.send({
                    from: 'Auth <onboarding@resend.dev>',
                    to: email,
                    subject: 'Verify your email address',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                            <h2>Welcome to Tech Hub!</h2>
                            <p>Please click the button below to verify your email address and activate your account.</p>
                            <a href="${baseUrl}/api/auth/verify?token=${verificationToken}" 
                               style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                               Verify Email
                            </a>
                            <p style="margin-top: 20px; font-size: 0.8rem; color: #666;">
                                If the button doesn't work, copy and paste this link into your browser:<br/>
                                ${baseUrl}/api/auth/verify?token=${verificationToken}
                            </p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError);
                // We still registered the user, but email failed.
            }
        }

        return NextResponse.json({
            message: 'User registered successfully. Please check your email to verify your account.',
            requiresVerification: true
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

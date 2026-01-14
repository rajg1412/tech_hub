import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { email, password, full_name } = body;

    const supabase = await createClient();

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: full_name,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
    });

    if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // 2. We don't need to manually create a profile here because the Trigger handles it!
    // But we might want to check if the session exists (if auto-confirm is on, or just return success).

    return NextResponse.json({
        message: "Signup successful. Please check your email for verification.",
        user: data.user
    });
}

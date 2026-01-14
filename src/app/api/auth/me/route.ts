import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Fetch role from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return NextResponse.json({
        authenticated: true,
        user: {
            id: user.id,
            email: user.email,
            role: profile?.role || user.user_metadata?.role || 'user'
        }
    });
}

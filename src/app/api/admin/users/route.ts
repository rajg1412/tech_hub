import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Helper to get Admin Client (Bypasses RLS)
const getAdminSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createAdminClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    // 1. Verify Requestor is Logged In
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // 2. Verify Requester is Admin (Regular client works for own profile)
    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (requesterProfile?.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 3. Use Admin Client to fetch ALL profiles (Bypassing RLS)
    const adminSupabase = getAdminSupabase();
    const { data: profiles, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    const users = profiles.map(p => ({
        _id: p.id,
        name: p.full_name || 'No Name',
        email: p.email || 'No Email',
        role: p.role,
        profile: p
    }));

    return NextResponse.json(users);
}

export async function PUT(req: NextRequest) {
    const supabase = await createClient();

    // 1. Verify Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data: requesterProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (requesterProfile?.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    // 2. Parse Request
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    const body = await req.json();

    const updateData: {
        role?: string;
        full_name?: string;
        title?: string;
        bio?: string;
        location?: string;
        skills?: string[];
    } = {
        role: body.role,
        full_name: body.name,
    };

    if (body.profile) {
        updateData.title = body.profile.title;
        updateData.bio = body.profile.bio;
        updateData.location = body.profile.location;
        updateData.skills = body.profile.skills;
    }

    // 3. Use Admin Client for Update
    const adminSupabase = getAdminSupabase();
    const { data, error } = await adminSupabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient();

    // 1. Verify Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data: requesterProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (requesterProfile?.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    // 2. Parse Request
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    // 3. Use Admin Client for Delete
    const adminSupabase = getAdminSupabase();
    // Optional: Delete from auth.users too if using Service Role (Requires explicit call to auth admin api)
    // adminSupabase.auth.admin.deleteUser(id) <-- This is possible with Service Role! 
    // Let's delete the profile first as per original logic, but we can actually delete the user now if we want.
    // Sticking to profile delete to match original scope, but using admin client ensures it works.

    const { error } = await adminSupabase.from('profiles').delete().eq('id', id);

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json({ message: 'User profile deleted' });
}

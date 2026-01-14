import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    // Check if requester is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (requesterProfile?.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch all profiles matches the old API shape expected by frontend
    // Frontend expects: { _id, name, email, role, profile: { ... } }
    // We will map Supabase profiles to this shape
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    const users = profiles.map(p => ({
        _id: p.id,
        name: p.full_name,
        email: p.email,
        role: p.role,
        profile: p
    }));

    return NextResponse.json(users);
}

export async function PUT(req: NextRequest) {
    const supabase = await createClient();

    // Admin Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data: requesterProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (requesterProfile?.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    const body = await req.json();

    // Update profile (which holds role, name, etc now)
    const updateData: any = {
        role: body.role,
        full_name: body.name,
    };

    if (body.profile) {
        updateData.title = body.profile.title;
        updateData.bio = body.profile.bio;
        updateData.location = body.profile.location;
        updateData.skills = body.profile.skills;
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
    // Note: Deleting from auth.users requires Service Role Key. 
    // For now we will just delete the profile which effectively "hides" the user from our app logic 
    // or we can implement full delete if the user provided the secret key in env vars.
    const supabase = await createClient();

    // Admin Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data: requesterProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (requesterProfile?.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json({ message: 'User profile deleted' });
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/register') &&
        !request.nextUrl.pathname.startsWith('/')
    ) {
        // Redirect to login if accessing protected routes without a user
        if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/account')) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Role-based protection for Admin routes
    // Note: detailed role checks (like querying the profiles table) are better handled in Server Components / API Routes
    // to avoid complex database operations in middleware unless using Custom Claims in JWT.
    if (user && request.nextUrl.pathname.startsWith('/admin')) {
        // Optionally check metadata if you sync role to user_metadata
        // const role = user.user_metadata.role;
        // if (role !== 'admin') return NextResponse.redirect(new URL('/', request.url));
    }

    return supabaseResponse
}

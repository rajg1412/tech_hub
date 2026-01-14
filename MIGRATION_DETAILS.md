# Migration Summary: MongoDB to Supabase

This document records the architectural changes and file modifications made to migrate the application from MongoDB to Supabase.

## 1. Architectural Changes

| Feature | Old (MongoDB) | New (Supabase) |
| :--- | :--- | :--- |
| **Database** | NoSQL (MongoDB Atlas) | Relational SQL (PostgreSQL) |
| **Connection** | `mongoose.connect()` in `dbConnect.ts` | HTTP/WebSocket via `@supabase/ssr` |
| **Data Models** | Mongoose Schemas (`models/User.ts`) | SQL Tables (`auth.users`, `public.profiles`) |
| **Authentication** | Custom JWT signing (`jose`), bcrypt hashing | Built-in Supabase Auth (GoTrue) |
| **Session Storage** | LocalStorage (initially), Custom Cookie | HttpOnly Secure Cookies |
| **Access Control** | Manual middleware checks | Row Level Security (RLS) Policies |

## 2. File Operations

### ❌ Deleted Files (Cleanup)
*   `src/lib/dbConnect.ts` - No longer needed to maintain a DB connection.
*   `src/models/User.ts` - Replaced by `auth.users` (Supabase generic auth) and `public.profiles`.
*   `src/models/Profile.ts` - Merged into `public.profiles` table.
*   `src/lib/auth.ts` - Replaced by Supabase Auth logic.
*   `src/app/api/auth/verify/route.ts` - Verification is now handled by Supabase's `auth/callback`.

### ✨ Created Files
*   **Supabase Utilities**:
    *   `src/utils/supabase/client.ts` - Browser client (configured to disable LocalStorage).
    *   `src/utils/supabase/server.ts` - Server client (accesses Cookies).
    *   `src/utils/supabase/middleware.ts` - Session refresher.
*   **Auth API Routes** (Backend-for-Frontend):
    *   `src/app/api/auth/login/route.ts` - Handles server-side login.
    *   `src/app/api/auth/signup/route.ts` - Handles server-side registration.
    *   `src/app/api/auth/me/route.ts` - Checks session status for the frontend.
*   **Setup Scripts**:
    *   `supabase_setup.sql` - SQL commands to create tables, triggers, and RLS policies.
    *   `run_migration.js` - Script to apply SQL changes.
    *   `sync_profiles.js` - Script to fix missing profile data.

### 📝 Modified Files
*   **Frontend Pages**:
    *   `src/app/login/page.tsx`: Updated to call `/api/auth/login` instead of Supabase SDK directly.
    *   `src/app/register/page.tsx`: Updated to call `/api/auth/signup`.
    *   `src/app/profile/page.tsx`: Updated to fetch data from `/api/profile`.
    *   `src/app/admin/page.tsx`: Updated to fetch data from `/api/admin/users`.
*   **API Routes**:
    *   `src/app/api/profile/route.ts`: Rewritten to query `supabase.from('profiles')` instead of `Profile.findOne()`.
    *   `src/app/api/admin/users/route.ts`: Rewritten to query Supabase and map `full_name` to `name`.
*   **Middleware**:
    *   `src/middleware.ts`: Updated to maintain Supabase session cookies.

## 3. Database Schema (Supabase)

Instead of a `User` document containing everything, data is split:
1.  **`auth.users`**: Managed by Supabase. Stores `email`, `id`.
2.  **`public.profiles`**: Managed by us.
    *   `id` (FK to auth.users)
    *   `role` ('user' or 'admin')
    *   `full_name`, `email`
    *   `bio`, `title`, `location`, `skills`

## 4. Key Security Improvements
*   **HttpOnly Cookies**: Moving tokens out of LocalStorage prevents XSS.
*   **RLS Policies**: Database-level security rules.

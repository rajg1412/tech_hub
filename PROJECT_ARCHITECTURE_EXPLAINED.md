# TechHub Project: The Definitive Guide

This document explains **exactly** how this application was built, why specific decisions were made, and how every part works together. It is designed to help you understand the system deeply.

---

## 1. The Thinking Process (Why we built it this way)

### Why Next.js + Supabase?
*   **Next.js**: We needed a modern framework that supports both **Frontend** (React UI) and **Backend** (API Routes) in one place. We didn't want two separate servers (like React + Express).
*   **Supabase**: We needed a database (PostgreSQL) and an Authentication system. Supabase provides both, plus real-time subscriptions and file storage, without needing to manage a complex server.

### Why "Server-Side Auth" with HttpOnly Cookies?
*   **Traditional Insecure Way**: Storing the login token in the browser's `localStorage`.
    *   *Risk*: If a hacker injects a script (XSS attack), they can read `localStorage` and steal the user's account.
*   **Our Secure Way**: The server sends a **Cookie** marked as `HttpOnly`.
    *   *Benefit*: The browser specifically hides this cookie from JavaScript code. Even if a hacker runs a script on your page, they **cannot** see the cookie. Only the server can read it.

### Why Separate User & Admin?
*   We need regular users to manage their *own* profiles.
*   We need an Admin to manage *everyone's* profiles.
*   We strictly separate these using database rules (RLS) so that even if the Frontend code has a bug, the Database itself will reject unauthorized access.

---

## 2. Serial File Walkthrough (Runtime Flow)

Imagine a user loads the website. Here is the order in which files execute:

### Step 1: `src/middleware.ts` (The Gatekeeper)
*   **What it does**: This file runs **before** every single page load.
*   **Why it exists**: It checks if the user has a Cookie. If they do, it tells Supabase "Refresh this user's session".
*   **If removed**: Users would get logged out randomly because their session cookies wouldn't be kept alive.

### Step 2: `src/app/layout.tsx` (The Wrapper)
*   **What it does**: This is the "shell" of your app. It holds the `<html>` and `<body>` tags.
*   **Why it exists**: It wraps every page in the `AuthProvider`.
*   **Key Line**: `<AuthProvider><Navbar />{children}</AuthProvider>`

### Step 3: `src/context/AuthContext.tsx` (The Brain)
*   **What it does**: As soon as the app loads, this file calls `/api/auth/me`.
*   **Purpose**: It asks the server: "Is this user logged in?".
*   **Result**: If yes, it sets the `user` state globally. The Navbar listens to this state to decide whether to show "Login" or "Logout".

### Step 4: `src/components/Navbar.tsx` (The Compass)
*   **What it does**: Displays links based on the `user` state from AuthContext.
*   **Logic**:
    *   If `user` exists -> Show "Profile" & "Logout".
    *   If `user.role === 'admin'` -> Show "Admin Panel".
    *   If no user -> Show "Login" & "Register".

### Step 5: `src/utils/supabase/server.ts` (The Secure Bridge)
*   **What it does**: This is a helper function used by our API routes.
*   **Why it differs from `client.ts`**: This client has **permission to read cookies**. It connects to Supabase *on behalf of the user* using their secret cookie.

---

## 3. Folder Structure Explained

### `src/app` (Frontend & Backend)
*   **Pages**: `login/page.tsx`, `register/page.tsx`, `profile/page.tsx`. These are the UI users see.
*   **API**: `src/app/api/`. This is your invisible backend server.
    *   **`/api/auth/`**: Authentication logic (Login, Signup, Check Session).
    *   **`/api/profile/`**: Getting and Updating the logged-in user's data.
    *   **`/api/admin/`**: Admin-only tools to fetch everyone's data.

### `src/utils/supabase` (Configuration)
*   **`client.ts`**: Used by the Browser. *Cannot* see cookies. Only used for public things.
*   **`server.ts`**: Used by the API. *Can* see cookies. This is how we securely talk to the DB.
*   **`middleware.ts`**: Keeps the secure cookie alive.

---

## 4. The Auth Flow (Step-by-Step)

### 1. Registration (`/register`)
1.  User fills form -> clicks "Register".
2.  Frontend calls `POST /api/auth/signup`.
3.  **Server** talks to Supabase to create the user in `auth.users` table.
4.  **Database Trigger** (SQL) automatically creates a row in `public.profiles`.
5.  Verification email is sent.

### 2. Login (`/login`)
1.  User enters Email/Password -> clicks "Login".
2.  Frontend calls `POST /api/auth/login`.
3.  **Server** verifies password with Supabase.
4.  Supabase returns a **Session Token**.
5.  **Server** saves this token in a **Secure HttpOnly Cookie**.
6.  **Server** responds "Success". The browser saves the cookie (but JS implies can't see it).

### 3. Staying Logged In
1.  User enters `/profile`.
2.  `middleware.ts` ensures the cookie is valid.
3.  `AuthContext` calls `/api/auth/me`.
4.  The API reads the cookie, confirms identity with Supabase, and returns "You are User X".

---

## 5. User vs Admin (How it works)

### Storage
*   In the database table `public.profiles`, there is a column `role`.
*   It's either `'user'` or `'admin'`.

### Security (RLS - Row Level Security)
This is the **real** protection. We wrote SQL rules:
1.  **Users**: "Can only view/edit rows where `id` matches their own ID."
2.  **Admins**: "Can view/edit ALL rows."

### Frontend Protection (Weak)
*   We hide the "Admin Panel" button if `user.role !== 'admin'`.
*   *Note*: A hacker could force the button to show by editing HTML.

### Backend Protection (Strong)
*   Even if a hacker clicks the button or calls the Admin API, the **Server** checks the `role` again.
*   The **Database** checks the RLS again.
*   If they aren't an admin, the database returns **0 results** or an Error.

---

## 6. CRUD Flow (Example: User updates bio)

1.  **UI**: User types "Hello World" in Bio input -> Clicks "Save".
2.  **Frontend**: `src/app/profile/page.tsx` grabs the text.
3.  **Fetch**: Calls `POST /api/profile` with `{ bio: "Hello World" }`.
    *(Note: No ID is sent! The server knows who you are by the Cookie.)*
4.  **API Route**: `src/app/api/profile/route.ts` runs.
    *   Calls `createClient()` (Server version).
    *   Gets User ID from the Cookie.
    *   Runs: `update profiles set bio = '...' where id = current_user_id`.
5.  **Database**: Checks RLS. "Does this ID match the user?" -> YES.
6.  **Response**: "Success". Frontend updates the UI.

---

## 7. Interview Summary (How to explain this project)

**"I built a secure Data Dashboard using Next.js and Supabase."**

**Key Technical Points:**
1.  **Architecture**: I used a "Backend-for-Frontend" pattern. The frontend never talks to the database directly; it goes through secure Next.js API routes.
2.  **Security**: I implemented **HttpOnly Cookies** for authentication to prevent XSS attacks (instead of insecure LocalStorage).
3.  **Database**: I used PostgreSQL with **Row Level Security (RLS)**. This ensures that even if the API logic fails, the database itself enforces that users can only touch their own data.
4.  **Scalability**: The system distinguishes between Users and Admins using Role-Based Access Control (RBAC) enforced at both the API and Database level.

import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

async function fixAndPromote() {
    console.log('Connecting to database...');

    if (!process.env.DATABASE_URL) {
        console.error('Error: DATABASE_URL is not defined in .env.local');
        return;
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected.');

        const email = 'rajg50103@gmail.com';

        // 1. Get the User ID from auth.users
        console.log(`Looking for user ${email} in auth.users...`);
        const userRes = await client.query("SELECT id, raw_user_meta_data FROM auth.users WHERE email = $1", [email]);

        if (userRes.rows.length === 0) {
            console.error('CRITICAL: User does not exist in Auth system! Please Register first.');
            return;
        }

        const userId = userRes.rows[0].id;
        const meta = userRes.rows[0].raw_user_meta_data || {};
        const fullName = meta.full_name || 'Admin User';
        console.log(`Found Auth User ID: ${userId}`);

        // 2. Check if Profile exists
        const profileRes = await client.query("SELECT * FROM public.profiles WHERE id = $1", [userId]);

        if (profileRes.rows.length === 0) {
            console.log('Profile missing. Creating one manually...');
            await client.query(
                "INSERT INTO public.profiles (id, email, full_name, role) VALUES ($1, $2, $3, 'admin')",
                [userId, email, fullName]
            );
            console.log('Created new Admin Profile.');
        } else {
            console.log('Profile exists. Updating role to admin...');
            await client.query("UPDATE public.profiles SET role = 'admin' WHERE id = $1", [userId]);
            console.log('Role updated to Admin.');
        }

        // Reload cache
        await client.query("NOTIFY pgrst, 'reload schema';");

    } catch (err) {
        console.error('Operation failed:', err);
    } finally {
        await client.end();
    }
}

fixAndPromote();

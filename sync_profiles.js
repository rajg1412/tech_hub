require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function syncProfiles() {
    console.log('Connecting to database...');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected.');

        // 1. Fetch all users from auth.users
        console.log('Fetching users from auth.users...');
        const usersRes = await client.query(`
      SELECT id, email, raw_user_meta_data 
      FROM auth.users
    `);

        console.log(`Found ${usersRes.rows.length} users in Auth system.`);

        for (const user of usersRes.rows) {
            const { id, email } = user;
            const meta = user.raw_user_meta_data || {};
            const fullName = meta.full_name || meta.name || email.split('@')[0]; // Fallback to email prefix if no name

            console.log(`Syncing user: ${email} (ID: ${id})`);

            // Upsert into profiles
            // We use ON CONFLICT to update if exists, or insert if missing
            await client.query(`
        INSERT INTO public.profiles (id, email, full_name)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) 
        DO UPDATE SET 
          email = EXCLUDED.email,
          full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name) 
      `, [id, email, fullName]);

            // Note: We use COALESCE for full_name to prefer existing profile name if it exists (and isn't null), 
            // but here we actually WANT to overwrite if it's currently null.
            // The logic `COALESCE(public.profiles.full_name, EXCLUDED.full_name)` keeps existing name if not null.
            // If we want to FORCE update valid names from Auth, we would just use `full_name = EXCLUDED.full_name`.
            // Given the user sees "No Name", the existing name is likely null, so this works.
            // But to be sure, let's force update email at least.
        }

        // Double check specific user rajg50103 to ensure Admin role is kept (it should be, as we didn't touch role)
        // But let's just output their status
        const adminCheck = await client.query("SELECT * FROM public.profiles WHERE email = 'rajg50103@gmail.com'");
        if (adminCheck.rows[0]) {
            console.log('Admin user status:', adminCheck.rows[0]);
        }

        // Reload cache
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log('Sync completed and schema cache reloaded.');

    } catch (err) {
        console.error('Operation failed:', err);
    } finally {
        await client.end();
    }
}

syncProfiles();

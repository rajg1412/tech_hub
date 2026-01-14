require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('Connecting to database...');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase/Heroku sometimes
    });

    try {
        await client.connect();
        console.log('Connected successfully.');

        const sqlPath = path.join(__dirname, 'supabase_setup.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL script...');
        await client.query(sql);

        // Also force a schema cache reload
        console.log('Reloading schema cache...');
        await client.query("NOTIFY pgrst, 'reload schema';");

        console.log('Migration completed successfully!');
        console.log('Tables created and Schema cache reloaded.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();

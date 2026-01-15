require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('Connecting to database...');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected successfully.');

        // Point to the NEW dynamic policies script
        const sqlPath = path.join(__dirname, 'update_policies_dynamic.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing Dynamic Admin Policy update...');
        await client.query(sql);

        console.log('Reloading schema cache...');
        await client.query("NOTIFY pgrst, 'reload schema';");

        console.log('Update completed! Admin policies are now dynamic defined by Database Role.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();

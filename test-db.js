const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    console.log('Testing MongoDB connection...');
    const uri = process.env.MONGODB_URI;
    console.log('URI:', uri ? uri.replace(/:([^:@]+)@/, ':****@') : 'undefined'); // Hide password

    if (!uri) {
        console.error('MONGODB_URI is missing!');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connection successful!');
        await mongoose.connection.close();
        console.log('Connection closed.');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        if (error.name === 'MongooseServerSelectionError') {
            console.error('This usually means your IP is not whitelisted in MongoDB Atlas or the connection string is wrong.');
        }
    }
}

testConnection();

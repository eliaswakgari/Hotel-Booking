// dropIndex.js
const mongoose = require('mongoose');
require('dotenv').config();

async function dropGeoIndex() {
  try {
    // Connect to your database using the actual MONGO_URI from .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MONGO');
    
    // Get the database name from the connection
    const dbName = mongoose.connection.db.hotelBookingDB;
    console.log(`Using database: ${dbName}`);
    
    // List all indexes first to see what exists
    const indexes = await mongoose.connection.collection('hotels').listIndexes().toArray();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Try to drop the 2dsphere index if it exists
    try {
      const result = await mongoose.connection.collection('hotels').dropIndex({ "location.coordinates": "2dsphere" });
      console.log('Index drop result:', result);
      console.log('Geospatial index dropped successfully!');
    } catch (dropError) {
      if (dropError.codeName === 'IndexNotFound') {
        console.log('2dsphere index not found - it may have already been removed');
      } else if (dropError.codeName === 'NamespaceNotFound') {
        console.log('Hotels collection not found - no indexes to drop');
      } else {
        throw dropError;
      }
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MONGO');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('This might mean the index was already removed or never existed');
  }
}

dropGeoIndex();
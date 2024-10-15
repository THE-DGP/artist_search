// Filename: addAbbreviations.js

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB URI
const uri = process.env.MONGO_URI;

// Create a MongoClient
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function addAbbreviations() {
  try {
    await client.connect();
    console.log('MongoDB connected for adding abbreviations');

    const db = client.db('local'); // Replace 'local' with your actual database name if different
    const collection = db.collection('artists');

    // Fetch all artist names from the collection
    const artists = await collection.find({}).toArray();

    // Iterate over each artist and generate abbreviation
    for (const artist of artists) {
      if (artist.name) {
        const abbreviation = artist.name
          .split(' ')
          .map(word => word[0].toUpperCase())
          .join('');

        // Update artist document with abbreviation field
        await collection.updateOne(
          { _id: artist._id },
          { $set: { abbreviation: abbreviation } }
        );
      }
    }

    console.log('Abbreviations added to all artists successfully');
  } catch (err) {
    console.error('Error adding abbreviations:', err);
  } finally {
    await client.close();
  }
}

// Execute the function to add abbreviations
addAbbreviations();

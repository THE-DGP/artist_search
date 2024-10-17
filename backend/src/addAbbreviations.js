// Filename: addAbbreviations.js

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function addAbbreviations() {
  try {
    await client.connect();
    console.log('MongoDB connected for adding abbreviations');

    const db = client.db('task');
    const collection = db.collection('artists');

    const artists = await collection.find({}).toArray();
    const bulkUpdates = [];

    for (const artist of artists) {
      if (artist.name) {
        const abbreviation = artist.name
          .split(' ')
          .map(word => word[0].toUpperCase())
          .join('');

        // Prepare bulk update operations
        bulkUpdates.push({
          updateOne: {
            filter: { _id: artist._id },
            update: { $set: { abbreviation: abbreviation } },
          },
        });
      }
    }

    // Perform bulk update to improve performance
    if (bulkUpdates.length > 0) {
      await collection.bulkWrite(bulkUpdates);
    }

    console.log('Abbreviations added to all artists successfully');
  } catch (err) {
    console.error('Error adding abbreviations:', err);
  } finally {
    await client.close();
  }
}

addAbbreviations();

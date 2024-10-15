const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const Trie = require('../utils/trie');
const Fuse = require('fuse.js');
require('dotenv').config();

// MongoDB URI from .env file
const uri = process.env.MONGO_URI;

// Create a MongoClient with the MongoDB Atlas URI
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Create a Trie instance and artistsData array
const artistTrie = new Trie();
let artistsData = [];

// Load artist names into the Trie, including abbreviations
async function loadArtistsIntoTrie() {
  try {
    await client.connect();
    console.log('MongoDB connected for Trie population');

    const db = client.db('task'); // Use the database name you set in MongoDB Atlas
    const collection = db.collection('artists');

    // Fetch all artist names from the collection
    artistsData = await collection.find({}, { projection: { name: 1, genres: 1, location: 1 } }).toArray();

    // Insert artist names and abbreviations into the Trie
    artistsData.forEach(artist => {
      if (artist.name) {
        artistTrie.insert(artist.name, artist.name);

        // Create and insert abbreviations into the Trie
        const abbreviation = artist.name.split(' ')
                                        .map(word => word[0].toUpperCase())
                                        .join('');
        artistTrie.insert(abbreviation, artist.name);
      }
    });

    console.log('Artists loaded into Trie successfully');
  } catch (err) {
    console.error('Error loading artists into Trie:', err);
  }
}

// Load artists into Trie when server starts
loadArtistsIntoTrie();

// Search for artist suggestions based on a prefix using the Trie
router.get('/suggest', (req, res) => {
  const prefix = req.query.q;

  if (!prefix) {
    return res.status(400).json({ error: 'Please provide a search prefix.' });
  }

  // Search for suggestions in the Trie
  const suggestionsFromTrie = artistTrie.search(prefix);

  // Use Fuse.js for fuzzy search if Trie results are insufficient
  const options = {
    includeScore: true,
    keys: ['name'],
    threshold: 0.4
  };
  const fuse = new Fuse(artistsData, options);
  const suggestionsFromFuse = fuse.search(prefix).map(result => result.item.name);

  // Combine suggestions and limit to 8
  const combinedSuggestions = [...new Set([...suggestionsFromTrie, ...suggestionsFromFuse])];
  const finalSuggestions = combinedSuggestions.slice(0, 8);

  return res.json(finalSuggestions);
});

// Search for full artist details by artist name
router.get('/search', async (req, res) => {
  const artistName = req.query.q;

  if (!artistName) {
    return res.status(400).json({ error: 'Please provide an artist name.' });
  }

  try {
    // Connect to the database to find full artist details
    const db = client.db('task'); // Use the database name you set in MongoDB Atlas
    const collection = db.collection('artists');

    // Fetch artist details that exactly match the artist name
    const artistDetails = await collection.find({ name: artistName }).toArray();

    if (artistDetails.length === 0) {
      return res.status(404).json({ message: 'No artist found.' });
    }

    // Return artist details as response
    return res.json(artistDetails);
  } catch (err) {
    console.error('Error while querying artists:', err);
    return res.status(500).json({ error: 'An error occurred while querying the database.' });
  }
});

module.exports = router;

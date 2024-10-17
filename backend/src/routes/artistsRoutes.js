// src/routes/artistRoutes.js

const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const Trie = require('../utils/trie');
const Fuse = require('fuse.js');
require('dotenv').config();

// MongoDB URI from .env file
const uri = "mongodb+srv://devdgp2003:Yc1WxLqgAhUclKto@cluster0.akfzt.mongodb.net/taskretryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with the MongoDB Atlas URI
const client = new MongoClient(uri);

// Create a Trie instance and artistsData array
const artistTrie = new Trie();
let artistsData = [];

// Load artist names into the Trie, including abbreviations
async function loadArtistsIntoTrie() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('MongoDB connected successfully for Trie population');

    const db = client.db('task'); // Update with the correct database name
    const collection = db.collection('artists');

    // Fetch all artist names from the collection
    artistsData = await collection.find({}, { projection: { name: 1, genres: 1, location: 1 } }).toArray();

    if (artistsData.length === 0) {
      console.error('No artist data found in the database.');
      return;
    }

    // Insert artist names and abbreviations into the Trie
    artistsData.forEach(artist => {
      if (artist.name) {
        const artistNameLowerCase = artist.name.toLowerCase();
        artistTrie.insert(artistNameLowerCase, artist.name);

        // Create and insert abbreviations into the Trie
        const abbreviation = artist.name.split(' ')
          .map(word => word[0].toUpperCase())
          .join('');
        artistTrie.insert(abbreviation, artist.name);
      }
    });

    console.log('Artists loaded into Trie successfully.');
  } catch (err) {
    console.error('Error loading artists into Trie:', err.message);
    console.error(err); // Log the complete error object for debugging
  }
}

// Load artists into Trie when server starts
loadArtistsIntoTrie();

// Search for artist suggestions based on a prefix using the Trie
router.get('/suggest', (req, res) => {
  let prefix = req.query.q;

  if (!prefix) {
    console.error("Suggest endpoint called without a prefix");
    return res.status(400).json({ error: 'Please provide a search prefix.' });
  }

  // Convert prefix to lowercase to ensure case-insensitive search
  prefix = prefix.toLowerCase();
  console.log(`Searching Trie for prefix: ${prefix}`);

  try {
    // Search for suggestions in the Trie
    const suggestionsFromTrie = artistTrie.search(prefix);

    console.log(`Suggestions from Trie: ${suggestionsFromTrie}`);

    // Use Fuse.js for fuzzy search if Trie results are insufficient
    const options = {
      includeScore: true,
      keys: ['name'],
      threshold: 0.4,
    };
    const fuse = new Fuse(artistsData, options);
    const suggestionsFromFuse = fuse.search(prefix).map(result => result.item.name);

    console.log(`Suggestions from Fuse.js: ${suggestionsFromFuse}`);

    // Combine suggestions and limit to 8 unique values
    const combinedSuggestions = [...new Set([...suggestionsFromTrie, ...suggestionsFromFuse])];
    const finalSuggestions = combinedSuggestions.slice(0, 8);

    console.log(`Final Suggestions: ${finalSuggestions}`);
    return res.json(finalSuggestions);
  } catch (err) {
    console.error('Error during suggestion retrieval:', err.message);
    return res.status(500).json({ error: 'An error occurred while retrieving suggestions.' });
  }
});

// Search for full artist details by artist name
router.get('/search', async (req, res) => {
  let artistName = req.query.q;

  if (!artistName) {
    console.error("Search endpoint called without an artist name");
    return res.status(400).json({ error: 'Please provide an artist name.' });
  }

  // Convert artistName to lowercase to match in a case-insensitive way
  artistName = artistName.toLowerCase();
  console.log(`Searching for artist details for: ${artistName}`);

  try {
    const db = client.db('task'); // Use the correct database name
    const collection = db.collection('artists');

    // Fetch artist details that exactly match the artist name (case-insensitive)
    const artistDetails = await collection.findOne({ name: new RegExp(`^${artistName}$`, 'i') });

    if (!artistDetails) {
      console.error(`No artist found for the given name: ${artistName}`);
      return res.status(404).json({ message: 'No artist found.' });
    }

    console.log(`Artist Details Found: ${JSON.stringify(artistDetails)}`);

    // Return artist details as response
    return res.json(artistDetails);
  } catch (err) {
    console.error('Error while querying artists:', err.message);
    return res.status(500).json({ error: 'An error occurred while querying the database.' });
  }
});

module.exports = router;

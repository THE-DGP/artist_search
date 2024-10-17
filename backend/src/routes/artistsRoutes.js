// src/routes/artistsRoutes.js

const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist'); // Import the Artist model
const Trie = require('../utils/trie');
const Fuse = require('fuse.js');

// Create a Trie instance
const artistTrie = new Trie();
let artistsData = [];

// Load artist names into the Trie, including abbreviations
async function loadArtistsIntoTrie() {
  try {
    console.log('Start loading artists into the Trie');

    // Fetch all artist names from the database using Mongoose
    artistsData = await Artist.find({}, { name: 1, genres: 1, location: 1 });

    // Verify if we have fetched any data from MongoDB
    if (artistsData.length === 0) {
      console.error('No artist data found in the database');
      return;
    }

    // Insert artist names and abbreviations into the Trie
    artistsData.forEach(artist => {
      if (artist.name) {
        // Convert artist name to lowercase before inserting into the Trie
        const lowerCaseName = artist.name.toLowerCase();
        artistTrie.insert(lowerCaseName, artist.name);
        console.log(`Inserted artist into Trie: ${artist.name}`);

        // Create and insert abbreviations into the Trie
        const abbreviation = artist.name.split(' ')
          .map(word => word[0].toUpperCase())
          .join('');
        artistTrie.insert(abbreviation, artist.name);
        console.log(`Inserted abbreviation into Trie: ${abbreviation}`);
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
router.get('/suggest', async (req, res) => {
  let prefix = req.query.q;

  if (!prefix) {
    console.error("Suggest endpoint called without a prefix");
    return res.status(400).json({ error: 'Please provide a search prefix.' });
  }

  // Convert prefix to lowercase to ensure case-insensitive search
  prefix = prefix.toLowerCase();
  console.log(`Searching Trie for prefix: ${prefix}`);

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

  // Combine suggestions and limit to 8
  const combinedSuggestions = [...new Set([...suggestionsFromTrie, ...suggestionsFromFuse])];
  const finalSuggestions = combinedSuggestions.slice(0, 8);

  console.log(`Final Suggestions: ${finalSuggestions}`);
  return res.json(finalSuggestions);
});

// Search for full artist details by artist name
router.get('/search', async (req, res) => {
  const artistName = req.query.q;

  if (!artistName) {
    console.error("Search endpoint called without an artist name");
    return res.status(400).json({ error: 'Please provide an artist name.' });
  }

  console.log(`Searching for artist details for: ${artistName}`);

  try {
    // Convert the artistName to lowercase for matching in case-insensitive manner
    const lowerCaseName = artistName.toLowerCase();

    // Fetch artist details that exactly match the artist name using Mongoose
    const artistDetails = await Artist.find({ name: new RegExp(`^${lowerCaseName}$`, 'i') });

    console.log(`Artist Details Found: ${JSON.stringify(artistDetails)}`);

    if (artistDetails.length === 0) {
      console.error("No artist found for the given name");
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

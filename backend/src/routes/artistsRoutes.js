const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist'); // Import the Artist model
const Trie = require('../utils/trie');
const Fuse = require('fuse.js');

// Create a Trie instance
const artistTrie = new Trie();
let artistsData = []; // Cached artists data to optimize suggestions

// Load artist names into the Trie, including abbreviations
async function loadArtistsIntoTrie() {
  try {
    // Fetch artist names in a paginated fashion to avoid long load times
    const artists = await Artist.find({}, { name: 1, genres: 1, location: 1 }).limit(5000); // Limit to avoid memory overflows
    artistsData = artists; // Cache artist data for use in fuzzy search

    // Insert artist names and abbreviations into the Trie
    artists.forEach(artist => {
      if (artist.name) {
        artistTrie.insert(artist.name, artist.name);
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
  let suggestions = artistTrie.search(prefix);

  // If suggestions are insufficient, fallback to fuzzy search with Fuse.js
  if (suggestions.length < 5) {
    const options = {
      includeScore: true,
      keys: ['name'],
      threshold: 0.4,
    };
    const fuse = new Fuse(artistsData, options);
    const fuseResults = fuse.search(prefix).map(result => result.item.name);
    suggestions = [...new Set([...suggestions, ...fuseResults])]; // Combine and dedupe
  }

  // Limit suggestions to top 8 results
  const finalSuggestions = suggestions.slice(0, 8);

  return res.json(finalSuggestions);
});

// Search for full artist details by artist name with pagination
router.get('/search', async (req, res) => {
  const artistName = req.query.q;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const pageNumber = parseInt(req.query.pageNumber) || 1;

  if (!artistName) {
    return res.status(400).json({ error: 'Please provide an artist name.' });
  }

  try {
    const skip = (pageNumber - 1) * pageSize;
    // Use regex for case-insensitive partial match
    const query = { name: new RegExp(`^${artistName}$`, 'i') };

    const artistDetails = await Artist.find(query).skip(skip).limit(pageSize);
    const totalRecords = await Artist.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / pageSize);

    if (artistDetails.length === 0) {
      return res.status(404).json({ message: 'No artist found.' });
    }

    return res.json({
      data: artistDetails,
      pagination: {
        totalPages,
        pageNumber,
        pageSize,
      },
    });
  } catch (err) {
    console.error('Error while querying artists:', err);
    return res.status(500).json({ error: 'An error occurred while querying the database.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist'); // Import the Artist model
const Trie = require('../utils/trie');
const Fuse = require('fuse.js');

// Create a Trie instance
const artistTrie = new Trie();
let artistsData = [];

// Load artist names into the Trie in batches
async function loadArtistsInBatches(batchSize = 500) {
  try {
    let skip = 0;
    let hasMore = true;

    console.log("Start loading artists into the Trie in batches");

    while (hasMore) {
      const batch = await Artist.find({}, { name: 1, genres: 1, location: 1 })
                                .skip(skip)
                                .limit(batchSize);

      if (batch.length > 0) {
        batch.forEach(artist => {
          if (artist.name) {
            artistTrie.insert(artist.name, artist.name);

            // Insert abbreviations into the Trie
            const abbreviation = artist.name.split(' ')
                                            .map(word => word[0].toUpperCase())
                                            .join('');
            artistTrie.insert(abbreviation, artist.name);
          }
        });
        skip += batchSize;
        console.log(`Loaded ${batch.length} artists into Trie, total so far: ${skip}`);
      } else {
        hasMore = false;
      }
    }

    console.log('Artists loaded into Trie successfully');
  } catch (err) {
    console.error('Error loading artists into Trie:', err);
  }
}

// Load artists into Trie when server starts
loadArtistsInBatches();

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
    threshold: 0.4,
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
    // Fetch artist details that exactly match the artist name
    const artistDetails = await Artist.find({ name: artistName });

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

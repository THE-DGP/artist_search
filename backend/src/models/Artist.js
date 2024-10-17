const mongoose = require('mongoose');

// Define the schema for the Artist collection
const ArtistSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
  },
  genres: {
    type: [String],
  },
  location: {
    type: String,
  },
  pp_url: {
    type: String,
  },
});

// Export the Artist model
module.exports = mongoose.model('Artist', ArtistSchema);

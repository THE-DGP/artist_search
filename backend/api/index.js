const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/mongoConfig'); // Import the MongoDB connection

dotenv.config(); // Configure environment variables

// Initialize Express App
const app = express();

// Connect to MongoDB Atlas
connectDB(); // Establish connection to MongoDB Atlas

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests

// Import and use Routes
const artistsRoutes = require('./routes/artistsRoutes');
app.use('/api', artistsRoutes); // All API routes will start with /api

// Default Route for Health Check
app.get('/', (req, res) => {
  res.send('Welcome to the Backend API connected to MongoDB Atlas');
});

// Export the app as a serverless function for Vercel
module.exports = app; // Necessary for Vercel deployment as a serverless function

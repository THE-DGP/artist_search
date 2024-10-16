const express = require('express'); // Main framework
const cors = require('cors'); // Middleware to handle CORS
const dotenv = require('dotenv'); // Environment variables

dotenv.config(); // Load environment variables
const connectDB = require('../src/config/mongoConfig'); // Connect MongoDB

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Define Routes
const artistsRoutes = require('../src/routes/artistsRoutes'); // Import artist routes
app.use('/api', artistsRoutes);

// Test Route to confirm server is working
app.get('/', (req, res) => {
  res.send('Welcome to the Backend API connected to MongoDB');
});

// Export the app for Vercel
module.exports = app;

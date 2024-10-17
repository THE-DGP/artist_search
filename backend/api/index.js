// api/index.js

const express = require('express');
const cors = require('cors');
const dotenv = require("dotenv");
const { MongoClient } = require('mongodb');

dotenv.config();

const connectDB = require('../src/config/mongoConfig'); // Adjusted path

const app = express();
// app.use(cors()); // Allow cross-origin requests
app.use(cors({
  origin: '*', // This allows all origins to access the API
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));


app.use(express.json()); // Parse JSON requests

// Set up the MongoDB client globally
let dbClient;

async function initializeMongo() {
  if (!dbClient) {
    try {
      dbClient = await connectDB(); // Ensure DB is connected
      console.log("MongoDB connected successfully.");
    } catch (error) {
      console.error("MongoDB connection failed:", error);
    }
  }
}

// Middleware to ensure database connection is available
async function dbMiddleware(req, res, next) {
  if (!dbClient) {
    await initializeMongo();
  }
  req.dbClient = dbClient; // Make the dbClient available via the request
  next();
}

app.use(dbMiddleware);

// Define Routes
const artistsRoutes = require('../src/routes/artistsRoutes'); 
app.use('/api', artistsRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Welcome to the Backend API connected to MongoDB');
});

module.exports = app;

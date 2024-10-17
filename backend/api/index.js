

// Setup Express and MongoDB connection
const express = require('express');
const cors = require('cors');
const dotenv = require("dotenv");
const connectDB = require('../src/config/mongoConfig'); 

dotenv.config();

const app = express();
app.use(cors(
  {
  origin: '*', // This allows all origins to access the API
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}
)); // Allow cross-origin requests
app.use(express.json()); // Parse JSON requests

// Define Routes
const artistsRoutes = require('./src/routes/artistsRoutes'); 

// Start the server after connecting to MongoDB
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Use Routes
    app.use('/api', artistsRoutes);

    // Test Route
    app.get('/', (req, res) => {
      res.send('Welcome to the Backend API connected to MongoDB');
    });

    // Dynamic Port Setting
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();

// Setup Express and MongoDB connection
const express = require('express');
const cors = require('cors');
const dotenv = require("dotenv");

dotenv.config();
const connectDB = require('./src/config/mongoConfig'); 

connectDB(); // Connect to MongoDB

const app = express();
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON requests

// Define Routes
const artistsRoutes = require('./src/routes/artistsRoutes'); 
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

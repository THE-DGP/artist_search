const express = require('express'); // Make sure this is installed
const cors = require('cors'); // Make sure this is installed

const dotenv = require("dotenv");

dotenv.config();
const connectDB = require('./config/mongoConfig'); // Import the MongoDB connection

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Define Routes
const artistsRoutes = require('./routes/artistsRoutes'); // Import the artist routes
app.use('/api', artistsRoutes);

// Test Route to confirm server is working
app.get('/', (req, res) => {
  res.send('Welcome to the Backend API connected to MongoDB');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

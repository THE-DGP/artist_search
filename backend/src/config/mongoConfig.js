// src/config/mongoConfig.js
const { MongoClient } = require('mongodb');

let client;

const connectDB = async () => {
  if (client) {
    // Reuse the existing client if already connected
    return client;
  }

  try {
    const uri = process.env.MONGO_URI;
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Allow multiple concurrent requests (adjust as needed)
    });
    await client.connect();
    console.log("MongoDB connected successfully");
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

module.exports = connectDB;

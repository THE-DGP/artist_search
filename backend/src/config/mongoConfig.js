// src/config/mongoConfig.js

const { MongoClient } = require('mongodb');

let client;

const connectDB = async (retries = 5, delay = 5000) => {
  if (client) return client; // Reuse the existing client

  while (retries) {
    try {
      const uri = process.env.MONGO_URI;
      client = new MongoClient(uri, {
        connectTimeoutMS: 30000, // Increased connection timeout to 30 seconds
        serverSelectionTimeoutMS: 30000, // Increased server selection timeout to 30 seconds
        socketTimeoutMS: 45000, // Socket timeout to 45 seconds
      });
      await client.connect();
      console.log("Successfully connected to MongoDB");
      return client;
    } catch (error) {
      console.error(`Failed to connect to MongoDB, attempts remaining: ${retries - 1}`, error);
      retries -= 1;
      await new Promise(res => setTimeout(res, delay));
    }
  }

  throw new Error("Failed to connect to MongoDB after multiple attempts");
};

module.exports = connectDB;

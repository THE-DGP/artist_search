// src/config/mongoConfig.js

const { MongoClient } = require('mongodb');

let client;

const connectDB = async () => {
  if (client) return client; // Reuse the existing client

  try {
    const uri = process.env.MONGO_URI;
    client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();
    console.log("MongoDB connected successfully.");
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

module.exports = connectDB;

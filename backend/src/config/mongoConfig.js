// src/config/mongoConfig.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = "mongodb+srv://devdgp2003:Yc1WxLqgAhUclKto@cluster0.akfzt.mongodb.net/taskretryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(uri, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Time out after 10 seconds instead of default
    });
    console.log('MongoDB connected successfully using Mongoose');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

module.exports = connectDB;

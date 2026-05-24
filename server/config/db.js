const mongoose = require('mongoose');
const config = require('./config');

const mongoUrl = `mongodb://root:example@mongodb:27017/mydatabase?authSource=admin`;

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Reusing existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    await mongoose.connect(mongoUrl);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;

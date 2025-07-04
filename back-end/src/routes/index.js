import { connect, connection } from 'mongoose';
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/dementiaDashboard', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};


import User from './models/User';

// Insert a new user
const createUser = async () => {
  const user = new User({ name: 'Alice', email: 'alice@example.com' });

  try {
    await user.save();
    console.log('📥 User saved to MongoDB');
  } catch (err) {
    console.error('❌ Error saving user:', err);
  }
};

// Wait for connection before running
connection.once('open', () => {
  createUser();
});


// db.js



module.exports = connectDB;














// server.js
const express = require('express');
const mongoose = require('mongoose'); // Use mongoose for MongoDB
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// Removed http and findAvailablePort for simplicity and standard express setup
// as your patient routes will handle API calls from frontend.

// Import routes
const patientRoutes = require('./routes/patients'); // Correct path to your patient routes

// Configure environment variables (if you have a .env file for MongoDB URI)
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/patienttracker';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

connectDB();

const app = express();

// Add middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3001', // Adjust this to your front-end URL (e.g., React's default is 3000)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(morgan('dev')); // 'dev' is good for development, 'combined' for production
app.use(express.json()); // Body parser

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Add test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is connected!' });
});

// Use patient routes
app.use('/api/patients', patientRoutes); // All patient-related routes start with /api/patients

// Placeholder for User model if you decide to implement it later
// const User = require('./models/User'); // Assuming you have a User model
// app.post('/users', async (req, res) => {
//   try {
//     const user = new User(req.body);
//     await user.save();
//     res.status(201).send(user);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// app.get('/users', async (req, res) => {
//   try {
//     const users = await User.find();
//     res.send(users);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });


// Define the port (using a common one like 3000 or 5000 for backend)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});














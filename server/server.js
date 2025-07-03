const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const setupWebSocketServer = require('./websocket/wsServer');
const jwt = require('jsonwebtoken');
dotenv.config();

const User = require('./models/User'); // Or wherever your User model is


// Load environment variables

// ✅ Safety check for JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined in .env. Exiting...");
  process.exit(1); // Stop the server to avoid broken auth
}

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/driftguard')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Set up WebSocket server
setupWebSocketServer(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const path = require('path');

// ✅ Add this ABOVE the wildcard route
app.get('/api/test-token', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: 'Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ valid: true, user: { id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(401).json({ valid: false, error: error.message });
  }
});


// Serve frontend
//app.use(express.static(path.join(__dirname, '../client/dist'))); // Adjust if you're using React/Vite

//app.get('*', (req, res) => {
//  res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
//});


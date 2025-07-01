const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, patientKey } = req.body;
    
    console.log('Registration request received:', { name, email, role });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user object
    const newUser = new User({
      name,
      email,
      password,
      role: role === 'doctor' ? 'guardian' : role // Map 'doctor' to 'guardian'
    });
    
    // Generate patient key for patients
    if (role === 'patient') {
      newUser.patientKey = uuidv4().substring(0, 8);
    }
    
    // Link guardian/doctor to patient if patientKey provided
    if ((role === 'guardian' || role === 'doctor') && patientKey) {
      const patient = await User.findOne({ patientKey, role: 'patient' });
      if (!patient) {
        return res.status(400).json({ message: 'Invalid patient key' });
      }
      newUser.linkedPatientId = patient._id;
    }
    
    // Save user to database
    await newUser.save();
    
    console.log('User registered successfully:', { id: newUser._id, role: newUser.role });
    
    res.status(201).json({ 
      message: 'User registered successfully',
      patientKey: newUser.patientKey
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key_for_development', { expiresIn: '7d' });
    
    // Return user data and token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientKey: user.patientKey,
      linkedPatientId: user.linkedPatientId,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;



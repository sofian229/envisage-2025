const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generatePatientKey } = require('../utils/generatePatientKey');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/signup
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, patientKey } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Handle different roles
    if (role === 'patient') {
      // Generate a unique patient key for patients
      const newPatientKey = generatePatientKey();
      
      const user = await User.create({
        name,
        email,
        password,
        role,
        patientKey: newPatientKey
      });
      
      if (user) {
        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          patientKey: user.patientKey,
          token: generateToken(user._id)
        });
      }
    } else if (role === 'doctor' || role === 'guardian') {
      // For doctors and guardians, validate the patient key
      if (!patientKey) {
        return res.status(400).json({ message: 'Patient key is required' });
      }
      
      const patient = await User.findOne({ patientKey, role: 'patient' });
      
      if (!patient) {
        return res.status(400).json({ message: 'Invalid patient key' });
      }
      
      const user = await User.create({
        name,
        email,
        password,
        role,
        linkedPatientId: patient._id
      });
      
      if (user) {
        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          linkedPatientId: user.linkedPatientId,
          token: generateToken(user._id)
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for user email
    const user = await User.findOne({ email });
    
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientKey: user.patientKey,
        linkedPatientId: user.linkedPatientId,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser };
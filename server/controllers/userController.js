const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientKey: user.patientKey,
        linkedPatientId: user.linkedPatientId
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient info (for doctors and guardians)
// @route   GET /api/patient-info
// @access  Private (doctors and guardians only)
const getPatientInfo = async (req, res) => {
  try {
    if (!req.user.linkedPatientId) {
      return res.status(400).json({ message: 'No linked patient found' });
    }
    
    const patient = await User.findById(req.user.linkedPatientId).select('-password');
    
    if (patient) {
      res.json({
        _id: patient._id,
        name: patient.name,
        email: patient.email
      });
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUserProfile, getPatientInfo };
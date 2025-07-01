const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get patient info (for guardians and doctors)
router.get('/patient-info', auth, async (req, res) => {
  try {
    // Only guardians and doctors can access patient info
    if (req.user.role !== 'guardian' && req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get linked patient
    if (!req.user.linkedPatientId) {
      return res.status(400).json({ message: 'No linked patient found' });
    }
    
    const patient = await User.findById(req.user.linkedPatientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Return patient info (excluding sensitive data)
    res.json({
      id: patient._id,
      name: patient.name,
      role: patient.role,
      patientKey: patient.patientKey,
      email: patient.email
    });
  } catch (error) {
    console.error('Error fetching patient info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all guardians linked to a patient (for patient view)
router.get('/linked-guardians', auth, async (req, res) => {
  try {
    // Only patients can access their linked guardians
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find all guardians linked to this patient
    const guardians = await User.find({ 
      linkedPatientId: req.user._id,
      role: { $in: ['guardian', 'doctor'] }
    }).select('_id name role email');
    
    res.json(guardians);
  } catch (error) {
    console.error('Error fetching linked guardians:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getUserProfile, getPatientInfo } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// Get user profile
router.get('/profile', protect, getUserProfile);

// Get patient info (for doctors and guardians only)
router.get('/patient-info', protect, checkRole('doctor', 'guardian'), getPatientInfo);

module.exports = router;
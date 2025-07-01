const crypto = require('crypto');

// Generate a secure random patient key
const generatePatientKey = () => {
  return crypto.randomBytes(16).toString('hex');
};

module.exports = { generatePatientKey };
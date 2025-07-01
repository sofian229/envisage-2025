const jwt = require('jsonwebtoken');
const User = require('../models/User');

const wsAuth = async (request) => {
  try {
    const token = request.url.split('token=')[1]?.split('&')[0];
    
    if (!token) {
      return { authenticated: false, error: 'No token provided' };
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return { authenticated: false, error: 'User not found' };
    }
    
    return { authenticated: true, user };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
};

module.exports = wsAuth;
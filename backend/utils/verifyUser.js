const jwt = require('jsonwebtoken');
 const User = require('../models/user.model');
 const errorHandler = require('./error');

const verifyToken = async (req, res, next) => {
  try {

    if (req.path.startsWith('/admin')) {
      return next();
    }

    
    const token = req.cookies.access_token;// Assuming the token is stored in a cookie named 'token'
    console.log('token:', token);
    if (!token) {
      return next(errorHandler(401, 'No token found, please log in again.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    req.user = user; 
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(errorHandler(401, 'Token expired, please log in again.'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(errorHandler(401, 'Invalid token, please log in again.'));
    } else {
      return next(error);
    }
  }
};
module.exports = verifyToken;

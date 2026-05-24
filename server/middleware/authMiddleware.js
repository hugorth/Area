const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware function to verify JWT token from the Authorization header.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a 401 status with a message if the token is missing or invalid.
 *
 * @throws {Error} - Throws an error if the token is invalid or expired.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token is missing from Authorization header' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    if (!decoded.id) {
      return res.status(401).json({ message: 'User ID is missing in token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error decoding token:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;

const jwt = require('jsonwebtoken');

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';

/**
 * Middleware to verify admin authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  try {
    // Get authorization header
    const auth = req.headers.authorization;
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Missing Authorization header'
      });
    }

    // Parse Bearer token
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid Authorization header format. Expected: "Bearer <token>"'
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user has admin role
    if (!decoded.role || decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    // Attach admin info to request
    req.admin = decoded;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    console.error('❌ Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * Generate admin token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateAdminToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    
    if (!auth) {
      return next();
    }

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role === 'admin') {
      req.admin = decoded;
    }
    
    next();

  } catch (error) {
    // Don't fail the request, just continue without auth
    next();
  }
};

module.exports = {
  requireAdmin,
  generateAdminToken,
  optionalAuth
};

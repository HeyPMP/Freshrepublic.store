const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token', error: error.message });
  }
};

const sellerAuth = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Seller access required' });
    }
    next();
  });
};

const adminAuth = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  });
};

const customerAuth = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Customer access required' });
    }
    next();
  });
};

module.exports = { authMiddleware, sellerAuth, adminAuth, customerAuth };

// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

module.exports = async function (req, res, next) {
  try {
    const header = req.headers['authorization'] || req.headers['Authorization'];
    if (!header) return res.status(401).json({ msg: 'No token provided' });
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : header;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attach user id and user object (without password)
    req.userId = decoded.id;
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};

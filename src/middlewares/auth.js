/* eslint-disable consistent-return */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[+[]] === 'Bearer'
  ) {
    token = req.headers.authorization.split(' ').pop();
  } else if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.query.token) {
    token = req.query.token;
  } else {
    return res.status(401).json({ status: 'failure', error: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ status: 'failure', error: 'Not authorized to access this route' });
  }
};

// eslint-disable-next-line arrow-body-style
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'failure',
        error: `User role "${req.user.role}" is not authorized to access this route`,
      });
    }
    next();
  };
};


exports.isUserVerified = (allowIfUnverified = false) => {
  return async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (user.isVerified && allowIfUnverified) {
      return res.status(400).json({ status: 'failure', message: 'Your account has already been verified!' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ status: 'failure', message: 'Kindly verify your account to be able to access this route.' });
    }

    next()
  }
}
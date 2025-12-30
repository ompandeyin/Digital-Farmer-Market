import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '30d'
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Generate password reset token
export const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  return { resetToken, resetTokenHash };
};

// Hash password reset token
export const hashPasswordResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

// Format price
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(price);
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Generate unique order number
export const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Paginate results
export const paginate = (page = 1, limit = 10) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  return {
    skip: (pageNum - 1) * limitNum,
    limit: limitNum,
    page: pageNum
  };
};

// Parse sort string
export const parseSort = (sortStr = '-createdAt') => {
  return sortStr.split(',').reduce((acc, sort) => {
    const field = sort.trim();
    if (field.startsWith('-')) {
      acc[field.slice(1)] = -1;
    } else {
      acc[field] = 1;
    }
    return acc;
  }, {});
};

// Build filter object
export const buildFilter = (query) => {
  const filter = {};
  const allowedFields = ['category', 'farmer', 'minPrice', 'maxPrice', 'rating', 'search'];

  Object.keys(query).forEach(key => {
    if (allowedFields.includes(key)) {
      if (key === 'minPrice') {
        filter.price = { ...filter.price, $gte: parseFloat(query[key]) };
      } else if (key === 'maxPrice') {
        filter.price = { ...filter.price, $lte: parseFloat(query[key]) };
      } else if (key === 'rating') {
        filter['ratings.average'] = { $gte: parseFloat(query[key]) };
      } else if (key === 'search') {
        filter.$text = { $search: query[key] };
      } else {
        filter[key] = query[key];
      }
    }
  });

  return filter;
};

import rateLimit from 'express-rate-limit';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Auth rate limiter - stricter

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Create rate limiter - for POST/PUT/DELETE
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many creations from this IP, please try again later.',
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Search rate limiter
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many search requests, please slow down.',
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Bid rate limiter - very strict
export const bidLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 3, // max 3 bids per second
  message: 'Bidding too fast, slow down.',
  skip: (req) => process.env.NODE_ENV === 'development'
});

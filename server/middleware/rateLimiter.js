const RateLimit = require('../models/RateLimit');

const loginRateLimiter = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Find an existing record for this IP
    let record = await RateLimit.findOne({ ip });
    
    if (!record) {
      // Create a new record
      record = new RateLimit({ ip });
      await record.save();
      return next();
    }
    
    // Increment the hits
    record.hits += 1;
    await record.save();
    
    // If hits exceed the limit (e.g., 5 attempts per minute)
    if (record.hits > 5) {
      return res.status(429).json({ 
        message: 'Too many login attempts from this IP, please try again after a minute.' 
      });
    }
    
    next();
  } catch (error) {
    // If rate limiter fails, allow the request but log the error
    console.error('Rate Limiter Error:', error);
    next();
  }
};

module.exports = { loginRateLimiter };

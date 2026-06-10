const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true,
  },
  hits: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60, // Document automatically deletes after 60 seconds (1 minute)
  },
});

module.exports = mongoose.model('RateLimit', rateLimitSchema);

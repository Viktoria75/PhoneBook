const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Helper: generate JWT
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required.' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = new User({
      username,
      email,
      phone: phone || '',
      passwordHash: password, // pre-save hook will hash it
    });

    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// GET /api/auth/me - get current user from token
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user.', error: error.message });
  }
});

module.exports = router;

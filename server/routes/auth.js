const express = require('express');
const requireAuth = require('../middleware/auth');
const authService = require('../services/authService');

const { loginRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// GET /api/auth/me - get current user from token
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    if (error.message === 'User not found.') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to get user.', error: error.message });
  }
});

module.exports = router;

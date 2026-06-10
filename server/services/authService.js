const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

class AuthService {
  async register({ username, email, phone, password }) {
    if (!username || !email || !password) {
      throw new Error('Username, email and password are required.');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const user = new User({
      username,
      email,
      phone: phone || '',
      passwordHash: password, // pre-save hook will hash it
    });

    await user.save();
    const token = signToken(user);
    return { token, user };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = signToken(user);
    return { token, user };
  }

  async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  }
}

module.exports = new AuthService();

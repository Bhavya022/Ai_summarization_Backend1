// controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const saltRounds = 10;

// Register a new user
const register = async (req, res) => {
  const { username, email, password } = req.body;
  console.log(req.body);
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Log in a user
const login = async (req, res) => {
  const { email, password } = req.body;
   console.log(req.body);
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const accessToken = jwt.sign({ username: user.username }, process.env.JWT_SECRET || 'DunlinAI', { expiresIn: '1h' });
    console.log(accessToken,user);
    res.json({ accessToken,user });
  } catch (error) { 
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };

const express = require('express');
const router = express.Router();
const Validate = require('./validation');
const jwt = require('../middleware/jwt');
const UserModel = require('../models/user');
const bcrypt = require('bcrypt');  // <-- important

// LOGIN USER
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request format
    if (!Validate.login(email, password)) {
      return res.status(400).json({ error: 'Invalid credentials format' });
    }

    // Find user in database
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('logged in', user);
    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        joined: user.updatedAt
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// REGISTER USER
router.post('/register', async (req, res) => {
  try {
    console.log('Registering user with data:', req.body);
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !Validate.register(name, email, password)) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Check if user already exists
    const exist = await UserModel.findByEmail(email);
    if (exist) {
      return res.status(400).json({ error: 'User already exists' });
    }

    if(exist.name === name) {
      return res.status(400).json({error: 'Username all ready taken'});
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword
    });

    // Generate token immediately after registration (optional)
    const token = jwt.sign({ email });

    res.status(201).json({
      message: "User registered successfully",
      newUser: {
        email: newUser.email,
        name: newUser.name
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;

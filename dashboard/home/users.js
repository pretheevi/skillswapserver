const express = require('express');
const router = express.Router();
const User = require('../../models/users');
const jwt = require('../../middleware/jwt');

// GET all users except the logged-in user (hide passwords)
router.get('/users', jwt.authMiddleware, async (req, res) => {
  try {
    const loggedUserId = req.user._id; 

    const users = await User.find({ _id: { $ne: loggedUserId } })
      .select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;

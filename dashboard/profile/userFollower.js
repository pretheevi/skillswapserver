const express = require('express');
const router = express.Router();
const UserFollows = require('../../models/userFollows');
const jwt = require('../../middleware/jwt');


// GET followers list
router.get('/profile/followers', jwt.authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // profile owner (self for now)

    const followers = await UserFollows.getFollowers(
      userId,        // whose followers
      userId         // who is viewing (used for is_following)
    );

    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile/followers/byId/:id', jwt.authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id; // profile owner (self for now)

    const followers = await UserFollows.getFollowers(
      userId,        // whose followers
      userId         // who is viewing (used for is_following)
    );

    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET following list
router.get('/profile/following', jwt.authMiddleware, async (req, res) => {
  try {
    const following = await UserFollows.getFollowing(req.user.id);
    res.json(following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile/following/byId/:id', jwt.authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id; 
    const following = await UserFollows.getFollowing(userId);
    res.json(following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/users/:userId/follow', jwt.authMiddleware, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId);

    if (followerId === followingId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    await UserFollows.follow(followerId, followingId);

    res.json({ message: 'Followed successfully' });
  } catch (err) {
    // SQLite UNIQUE constraint → already followed
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Already following' });
    }

    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:userId/follow', jwt.authMiddleware, async (req, res) => {
  try {
    await UserFollows.unfollow(req.user.id, req.params.userId);
    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;

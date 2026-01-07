const express = require('express');
const router = express.Router();
const UserModel = require('../../models/user');
const UserFollows = require('../../models/userFollows');
const jwt = require('../../middleware/jwt');
const {uploadProfilePic} = require('../../middleware/multer');

// GET all users except the logged-in user (hide passwords)
router.get('/profile', jwt.authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('profile body', req.user);
    const userInfo = await UserModel.findById(req.user.id);
    const counts = await UserFollows.getCounts(userId);

    res.json({
      ...userInfo,
      follower_count: counts.followers,
      following_count: counts.following
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.get('/profileById/:id', jwt.authMiddleware, async (req, res) => {
  try {
    const loggedUser = req.user.id;
    const userId = req.params.id;
    console.log('profileById', userId)
    const userInfo = await UserModel.findById(userId);
    const counts = await UserFollows.getCounts(userId);

    const isFollowing = await UserFollows.isFollowing(loggedUser, userId);

    res.json({
      ...userInfo,
      follower_count: counts.followers,
      following_count: counts.following,
      is_following: isFollowing
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.get('/users/search', jwt.authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.q?.trim();

    if (!search) {
      return res.json([]);
    }

    const users = await UserModel.searchUsers(search, userId);
    res.json(users);

  } catch (err) {
    res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
});


const path = require('path');
const fs = require('fs');
const { error } = require('console');
const fsPromises = require('fs').promises;

router.post('/profile', jwt.authMiddleware, uploadProfilePic.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Fetch current user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {
      name: req.body.name || user.name,
      bio: req.body.bio || user.bio,
    };
    
    // 2. Handle avatar upload if file exists
    if (req.file) {
      // Delete old avatar if exists
      if (user.avatar && user.avatar !== '') {
        try {
          // Extract filename from the URL/path
          const avatarFilename = path.basename(user.avatar);
          const oldAvatarPath = path.join(process.cwd(), 'uploads', 'profiles', avatarFilename);
          
          console.log('Attempting to delete old avatar:', oldAvatarPath);
          
          // Check if file exists and delete
          if (fs.existsSync(oldAvatarPath)) {
            await fsPromises.unlink(oldAvatarPath);
            console.log('Successfully deleted old avatar');
          } else {
            console.log('Old avatar file not found at path:', oldAvatarPath);
          }
        } catch (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
          // Don't stop the update if deletion fails
        }
      }

      // Set new avatar path (relative URL for frontend)
      updateData.avatar = `/uploads/profiles/${req.file.filename}`;
    } else {
      // Keep existing avatar if no new file uploaded
      updateData.avatar = user.avatar;
    }

    // 3. Update user in database
    await UserModel.update(userId, updateData);
    
    // 4. Return updated user data
    const updatedUser = await UserModel.findById(userId);
    
    res.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar
      }
    });

  } catch(error) {
    console.error('Profile update error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        const filePath = path.join(process.cwd(), 'uploads', 'profiles', req.file.filename);
        if (fs.existsSync(filePath)) {
          await fsPromises.unlink(filePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile',
      message: error.message 
    });
  }
});

router.delete('/profile/avatar', jwt.authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user.avatar) {
      return res.status(400).json({ error: 'No avatar to delete' });
    }

    // 1. delete file
    const filePath = path.join(process.cwd(), user.avatar);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 2. update DB
    await UserModel.deleteAvatar(req.user.id);

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});


module.exports = router;

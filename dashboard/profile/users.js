const express = require('express');
const router = express.Router();
const UserModel = require('../../models/user');
const UserFollows = require('../../models/userFollows');
const jwt = require('../../middleware/jwt');
const {uploadProfilePic} = require('../../middleware/upload');
const cloudinary = require('../../config/cloudinary');

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

router.post('/profile', jwt.authMiddleware, uploadProfilePic.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Fetch current user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('xxxxx',user);
    const updateData = {
      name: req.body.name || user.name,
      bio: req.body.bio || user.bio,
      avatar: user.avatar || '', // Start with current avatar
      avatar_public_id: user.avatar_public_id || '',
    };

    // Handle avatar changes
    if (req.file) {
      // New file uploaded - remove old one if exists
      if (user.avatar_public_id) {
        try {
          const result = await cloudinary.uploader.destroy(user.avatar_public_id, { resource_type: 'image' });
          console.log('Cloudinary destroy result:', result); 
        } catch (cloudErr) {
          console.log('cloudinary delete failed', cloudErr);
        }
      }
      updateData.avatar = req.file.path;
      updateData.avatar_public_id = req.file.filename;
    } 
    // Check if user wants to remove avatar
    else if (req.body.remove_avatar === 'true' || req.body.avatar === '') {
      // Remove existing avatar if it exists
      if (user.avatar_public_id) {
        try {
          const result = await cloudinary.uploader.destroy(user.avatar_public_id, { resource_type: 'image' });
          console.log('Cloudinary destroy result (removing avatar):', result); 
        } catch (cloudErr) {
          console.log('cloudinary delete failed', cloudErr);
        }
      }
      // Set empty values for avatar
      updateData.avatar = '';
      updateData.avatar_public_id = '';
    }
    // If no file and no remove request, keep existing avatar (already set above)

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
        avatar: updatedUser.avatar || ''
      }
    });

  } catch(error) {
    console.error('Profile update error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        // If using Cloudinary, destroy the uploaded file
        if (req.file.filename) {
          await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'image' });
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

    // 2. update DB
    await UserModel.deleteAvatar(req.user.id);

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});


module.exports = router;

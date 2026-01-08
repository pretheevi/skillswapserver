const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Common file filter
const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP allowed'), false);
  }
};

// Post images
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillswap/posts',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 1080, height: 1080, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
  },
});

// Profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillswap/profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
  },
});

const uploadPostMedia = multer({
  storage: postStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadProfilePic = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = {
  uploadPostMedia,
  uploadProfilePic,
};

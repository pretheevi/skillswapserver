const multer = require('multer')
const path = require('path')

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), 'uploads', folder))
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`
      cb(null, uniqueName)
    }
  })


const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG and PNG files are allowed'), false)
  }
}

const uploadPostMedia = multer({
  storage: createStorage('posts'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
})

const uploadProfilePic = multer({
  storage: createStorage('profiles'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // profile pics smaller
})


module.exports = {
  uploadPostMedia,
  uploadProfilePic
}

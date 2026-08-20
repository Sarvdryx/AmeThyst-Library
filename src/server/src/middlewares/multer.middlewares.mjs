import multer from 'multer';

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only images are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_AVATAR_SIZE,
  },
  fileFilter: fileFilter,
});

// Middleware wrapper to handle Multer errors gracefully
export const handleAvatarUpload = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 2MB limit' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

export default upload;

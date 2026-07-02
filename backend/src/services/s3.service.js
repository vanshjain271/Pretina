const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'pretina-uploads';

/**
 * Multer middleware for uploading directly to S3.
 * Usage: upload.single('image') or upload.array('images', 5)
 */
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const folder = req.uploadFolder || 'general';
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${folder}/${uuidv4()}${ext}`;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isAllowed = allowedTypes.test(path.extname(file.originalname).toLowerCase())
      && allowedTypes.test(file.mimetype);
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
    }
  },
});

/**
 * Get the full public URL for an uploaded file.
 */
const getFileUrl = (key) => {
  return `https://${BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
};

/**
 * Delete a file from S3.
 * @param {string} key - The S3 object key (e.g., 'products/abc.jpg')
 */
const deleteFile = async (key) => {
  if (!key) return;
  try {
    // Extract key from full URL if needed
    if (key.includes('amazonaws.com/')) {
      key = key.split('amazonaws.com/')[1];
    }
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error('S3 delete error:', err.message);
  }
};

module.exports = { s3Client, upload, getFileUrl, deleteFile, BUCKET };

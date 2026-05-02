const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — no disk writes, we stream directly to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// Helper: upload a buffer to Cloudinary and return a promise
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// POST /api/upload/profile
router.post('/profile', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'arain-poultry/profiles',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary profile upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// POST /api/upload/document
router.post('/document', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const isPdf = req.file.mimetype === 'application/pdf';
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'arain-poultry/documents',
      resource_type: isPdf ? 'raw' : 'image',
      public_id: `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`,
    });
    res.json({ url: result.secure_url, name: req.file.originalname });
  } catch (error) {
    console.error('Cloudinary document upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

module.exports = router;

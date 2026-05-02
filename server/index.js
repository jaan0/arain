const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { Otp } = require('./models');

const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow if:
    // 1. No origin (like mobile apps or curl)
    // 2. Matches localhost
    // 3. Matches Vercel domain (anything ending in .vercel.app)
    // 4. Matches explicit FRONTEND_URL env var
    if (
      !origin || 
      origin.includes('localhost') || 
      origin.endsWith('.vercel.app') || 
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
    ) {
      callback(null, true);
    } else {
      console.log('CORS Blocked Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

// Generate & Send OTP
app.post('/api/auth/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Generate 8 digit OTP
  const otp = Math.floor(10000000 + Math.random() * 90000000).toString();

  try {
    // Save to DB (overwrites existing for this email if needed, or just creates new due to TTL)
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    // Send email to ADMIN, regardless of what email was entered (as per instructions)
    // Wait, the prompt said: "when email is entered the otp of 8 digits to be sent to and email address saved in env variables"
    const targetEmail = process.env.ADMIN_EMAIL;
    
    await transporter.sendMail({
      from: `"Arain Poultry Farm" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: "Your Login OTP",
      text: `Your OTP for Arain Poultry Farm portal is: ${otp}. It expires in 10 minutes.`,
    });

    // To show masked email on frontend
    const maskedEmail = targetEmail.substring(0, 3) + '********' + targetEmail.substring(targetEmail.indexOf('@'));

    res.json({ message: 'OTP sent successfully', maskedEmail });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const record = await Otp.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Delete OTP after use
    await Otp.deleteOne({ _id: record._id });

    // Generate JWT
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd, // set to true in production with HTTPS
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Check Session
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});


// Temporary Seed Endpoint
app.get('/api/seed', async (req, res) => {
  const { Dealer, Labour, DealerLedger } = require('./models');
  try {
    const dCount = await Dealer.countDocuments();
    if (dCount === 0) {
      const d1 = await Dealer.create({ name: 'Haji Tariq', phone: '0300-1234567', balance: 12400 });
      const d2 = await Dealer.create({ name: 'Chaudhry Saleem', phone: '0321-7654321', balance: 0 });
      
      await DealerLedger.create({ dealerId: d1._id, description: 'Took 8 Paiti', amount: 8400, type: 'CREDIT_GIVEN' });
      await DealerLedger.create({ dealerId: d1._id, description: 'Cash Payment', amount: 5000, type: 'PAYMENT_RECEIVED' });
      
      await Labour.create({ name: 'Rafiq Bhai', salary: 35000 });
      await Labour.create({ name: 'Zubair', salary: 40000 });
      res.json({ message: 'Database seeded successfully with initial data!' });
    } else {
      res.json({ message: 'Database already has data.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API ROUTES ---
app.use('/api/dealers', authenticateToken, require('./routes/dealers'));
app.use('/api/labour', authenticateToken, require('./routes/labour'));
app.use('/api/eggs', authenticateToken, require('./routes/eggs'));
app.use('/api/feed', authenticateToken, require('./routes/feed'));
app.use('/api/medicine', authenticateToken, require('./routes/medicine'));
app.use('/api/summary', authenticateToken, require('./routes/summary'));
app.use('/api/upload', authenticateToken, require('./routes/upload'));


const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      family: 4, 
      serverSelectionTimeoutMS: 5000 
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    if (!isProd) process.exit(1);
  }
};

if (!isProd) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
} else {
  // For Vercel/Serverless: connect on first request if needed, or rely on Vercel's behavior
  connectDB();
}

module.exports = app;

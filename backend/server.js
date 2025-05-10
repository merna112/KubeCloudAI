// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const userRoutes = require('./routes/user.route');
const authRoutes = require('./routes/auth.route');
const postRoutes = require('./routes/post.route');
const commentRoutes = require('./routes/comment.route');
const notificationRoutes = require('./routes/notification.route');
const chatRoutes = require('./routes/chat.route');
const codeRoutes = require('./routes/code.route');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
];

const productionOrigin = 'https://kube-cloud-ai.vercel.app';
if (allowedOrigins.indexOf(productionOrigin) === -1) {
  allowedOrigins.push(productionOrigin);
}

if (process.env.VERCEL_URL) {
  const vercelPreviewOrigin = `https://${process.env.VERCEL_URL}`;
  if (allowedOrigins.indexOf(vercelPreviewOrigin) === -1) {
    allowedOrigins.push(vercelPreviewOrigin);
  }
}

if (process.env.FRONTEND_CUSTOM_DOMAIN) {
  if (allowedOrigins.indexOf(process.env.FRONTEND_CUSTOM_DOMAIN) === -1) {
    allowedOrigins.push(process.env.FRONTEND_CUSTOM_DOMAIN);
  }
}

console.log('[CORS Setup] Final allowedOrigins list:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    console.log(`[CORS Check] Request origin: ${origin}`);
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`[CORS Check] Blocking origin: ${origin}. Not in allowed list:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/contact', notificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', chatRoutes);
app.use('/api/code', codeRoutes);

const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URI) {
      console.error('FATAL ERROR: DATABASE_URI is not defined.');
      return; // Exit the function if URI is not defined
    }
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected to Vercel!');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
  }
};

connectDB();

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB.');
});
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected.');
});

app.get('/api/health', (req, res) => {
  res.send('Backend API is running and healthy!');
});

app.use((err, req, res, next) => {
  console.error('Server Error Caught:', err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error!';
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running locally on http://localhost:${PORT}`);
    });
}

module.exports = app;
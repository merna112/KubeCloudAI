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


app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',  
  credentials: true
}));


app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/contact', notificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', chatRoutes);
app.use('/api/code', codeRoutes);

// Dazzling MongoDB connection setup
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 20,
    });
    console.log('🌟 Connected to MongoDB!');
  } catch (err) {
    console.error('⚠️ Error connecting to MongoDB:', err);
  }
};

// Connect to the database!
connectDB();

// Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🎉 Mongoose connected to the database!');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🚨 Mongoose disconnected.');
});

// Error-handling wizardry!
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error!';
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Root route (could be a simple homepage or redirect)
app.get('/', (req, res) => {
  if (!req.cookies.token) {
    return res.status(401).send({ success: false, message: 'No token found, please log in again.' });
  }
  res.send('Welcome to the backend of KubeCloudAI!');
});

// Start your fantastic server!
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

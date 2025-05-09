const multer = require('multer'); 
const path = require('path'); 
const bcryptjs = require("bcryptjs");
const errorHandler = require("../utils/error");
const User = require('../models/user.model');
const mongoose=require('mongoose');

const test = (req, res) => {
    res.json({ message: 'API is working!' });
  };
const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'You are not allowed to update this user' });
  }
  let updatedFields = { ...req.body };

  if (req.file) {
      updatedFields.profilePicture = `/uploads/profilePictures/${req.file.filename}`;
  }

  try {
      const updatedUser = await User.findByIdAndUpdate(
          req.params.userId,
          { $set: updatedFields },
          { new: true, runValidators: true } 
      );
      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
      }

      const { password, ...rest } = updatedUser._doc;
      res.status(200).json(rest);
  } catch (error) {
      console.error('Error updating user:', error); 
      next(error);
  }
};

   const deleteUser = async (req, res, next) => {
    if (!req.user.isAdmin && req.user.id !== req.params.userId) {
      return next(errorHandler(403, 'You are not allowed to delete this user'));
    }
    try {
      await User.findByIdAndDelete(req.params.userId);
      res.status(200).json('User has been deleted');
    } catch (error) {
      next(error);
    }
  };
  

  const signout = (req, res, next) => {
    try {
      res
        .clearCookie('access_token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',  
        })
        .status(200)
        .json('User has been signed out');
    } catch (error) {
      next(error);
    }
  };
  
  const getUsers = async (req, res, next) => {
    if (!req.user) {
      console.error('getUsers: Critical - req.user is undefined. Check verifyToken middleware.');
      return next(errorHandler(500, 'User authentication data not found in request (Server Error)'));
    }
  
    if (!req.user.isAdmin) {
      console.warn(`getUsers: Permission denied. User ID: ${req.user.id} is not an admin.`);
      return next(errorHandler(403, 'Forbidden: You are not authorized to view all users.'));
    }
    try {
      const startIndex = parseInt(req.query.startIndex, 10) || 0;
      const limit = parseInt(req.query.limit, 10) || 9; 
      const sortDirection = req.query.sort === 'asc' ? 1 : -1;
      const users = await User.find() 
        .sort({ createdAt: sortDirection })
        .skip(startIndex)
        .limit(limit)
        .select('-password'); 
      const totalUsers = await User.countDocuments(); 
      const now = new Date();
      const oneMonthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );
      const lastMonthUsers = await User.countDocuments({
        createdAt: { $gte: oneMonthAgo },
      });

      res.status(200).json({
        users: users, 
        totalUsers,
        lastMonthUsers, 
      });
  
    } catch (error) {
      console.error('getUsers: Error occurred while fetching users:', error);
      next(error);
    }
  };

  const getUser = async (req, res, next) => {
    try {
        const userId = req.params.id || req.userId;  
  
        if (!userId) {
            return next(errorHandler(400, 'User ID is missing in request'));
        }
  
        console.log('Searching for user with ID:', userId);
  
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return next(errorHandler(400, 'Invalid user ID format'));
        }
  
        const user = await User.findById(userId);
        if (!user) {
            return next(errorHandler(404, 'User not found'));
        }
  
        const { password, ...rest } = user._doc;
        res.status(200).json(rest);
    } catch (error) {
        next(error);
    }
  };
  
//function to validate loginAttempts
function validateLoginAttempts(attempts) {
  const parsedAttempts = parseInt(attempts, 10);
  return isNaN(parsedAttempts) ? 0 : parsedAttempts;
}

// Function to update loginAttempts
const updateLoginAttempts = async (userId, attempts) => {
  const validAttempts = validateLoginAttempts(attempts);

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { loginAttempts: validAttempts },
      { new: true }
    );

    if (!user) {
      console.error('User not found:', userId);
      return;
    }

    console.log('User updated successfully:', user);
  } catch (err) {
    console.error('Error updating user:', err);
    throw err; 
  }
};

const getAllUsersForNotifications = async (req, res, next) => { 
  try {
    const users = await User.find({}, '_id username email profilePicture'); 
    console.log('Backend - getAllUsersForNotifications - Users being sent:', JSON.stringify(users, null, 2)); 
    res.status(200).json({ docs: users || [] });
  } catch (error) {
    console.error('Error in getAllUsersForNotifications:', error);
    next(errorHandler(500, 'Failed to retrieve users for notifications'));
  }
};
  module.exports={test,updateUser,deleteUser,signout,getUsers,getUser,updateLoginAttempts,getAllUsersForNotifications };


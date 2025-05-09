const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

exports.createNotification = async (req, res) => {
   const { type, message, userId } = req.body; // تأكد من أن type يُرسل من Contact.jsx إذا كان مطلوبًا

   if (!mongoose.Types.ObjectId.isValid(userId)) {
     return res.status(400).json({ message: 'Invalid user ID' });
   }

   if (!type || !message || !userId) { 
     return res.status(400).json({ message: 'Type, message, and userId are required' });
   }

   try {
     const userExists = await User.findById(userId);
     if (!userExists) {
       return res.status(404).json({ message: 'User not found' });
     }
     const notification = new Notification({
       type,      
       message,
       user: userId 
     });
     await notification.save();
     res.status(201).json(notification);
   } catch (err) {
     console.error('Error creating notification:', err);
     res.status(500).json({ message: 'Failed to create notification', error: err.message });
   }
 };
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timestamp: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve notifications', error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID format' });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: 'Notification deleted successfully' });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};
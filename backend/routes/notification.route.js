const express = require('express');
const { getNotifications, createNotification, deleteNotification } = require('../controllers/notification.controller');
const verifyToken = require('../utils/verifyUser');

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.post('/', verifyToken, createNotification);
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;


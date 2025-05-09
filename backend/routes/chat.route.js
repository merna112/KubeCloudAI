const express = require('express');
const { handleChatMessage } = require('../controllers/chat.controller');

const router = express.Router();


router.post('/chat', handleChatMessage);


module.exports = router;
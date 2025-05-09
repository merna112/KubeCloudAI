const express = require('express');
const { executeCode } = require('../controllers/code.controller');


const router = express.Router();

router.post('/execute', /* verifyToken, */ executeCode);

module.exports = router;
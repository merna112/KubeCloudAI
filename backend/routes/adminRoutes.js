const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const verifyToken = require('../utils/verifyUser');


// Route to get admin dashboard
router.get('/dashboard', verifyToken, adminController.getDashboard);

// Route to create a new admin user
router.post('/create', verifyToken, adminController.createAdmin);

// Route to update admin user details
router.put('/update/:id', verifyToken, adminController.updateAdmin);

// Route to delete an admin user
router.delete('/delete/:id', verifyToken, adminController.deleteAdmin);

module.exports = router;

 const express = require('express');
const { test, updateUser, deleteUser, getUsers, getUser, signout , updateLoginAttempts, getAllUsersForNotifications} = require('../controllers/user.controller');
const verifyToken = require('../utils/verifyUser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();


router.delete('/delete/:userId', verifyToken, deleteUser);
router.get('/', verifyToken, getAllUsersForNotifications); 
router.post('/signout', signout);
router.get('/getusers', verifyToken, getUsers);
router.get('/:id', verifyToken, getUser);  

router.patch('/update-attempts/:userId', verifyToken, async (req, res) => {
    const { userId } = req.params;
    const { attempts } = req.body;

    try {
        await updateLoginAttempts(userId, attempts);
        res.status(200).json({ message: 'Login attempts updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update login attempts' });
    }
});

const createUploadsFolder = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderPath = 'uploads/profilePictures';
        createUploadsFolder(folderPath);
        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        cb(null, req.params.userId + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 }, // 1MB
    fileFilter: (req, file, cb) => {
        const allowedFileTypes = /jpeg|jpg|png/;
        const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedFileTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, and .png formats are allowed!'));
        }
    },
});
router.put('/update/:userId', verifyToken, upload.single('profilePicture'), updateUser);

module.exports = router;


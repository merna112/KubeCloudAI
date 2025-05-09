const express = require('express');
const { createComment,  getPostComments,  likeComment,  editComment, deleteComment,getComments ,addReply} = require('../controllers/comment.controller');
const router = express.Router();
const verifyToken = require('../utils/verifyUser');


router.get('/getPostComments/:postId', getPostComments);
router.post('/create', verifyToken, createComment);


router.put('/:commentId/reply', verifyToken, addReply);
router.put('/likeComment/:commentId', verifyToken, likeComment);
router.put('/editComment/:commentId', verifyToken, editComment);
router.delete('/deleteComment/:commentId', verifyToken, deleteComment);
router.get('/getcomments', verifyToken, getComments);

module.exports = router;
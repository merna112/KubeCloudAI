const Comment = require('../models/comment.model');
const errorHandler = require('../utils/error');

const createComment = async (req, res, next) => {
  try {
    const { content, postId, parentId } = req.body;

    if (!req.user || !req.user.id) {
      return next(new Error('Authentication failed: User ID is missing'));
    }

    const newComment = new Comment({
      content,
      postId,
      userId: req.user.id,
      parentId: parentId || null,
    });

    await newComment.save();
    const populatedComment = await Comment.findById(newComment._id).populate('userId', 'username profilePicture _id');
    res.status(200).json(populatedComment || newComment);
  } catch (error) {
    next(error);
  }
};

const getPostComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate('userId', 'username profilePicture _id')
      .populate({
          path: 'replies',
          populate: {
             path: 'userId',
             select: 'username profilePicture _id'
          }
       })
      .sort({ createdAt: -1 });

    const buildCommentTree = (allComments) => {
      const commentMap = {};
      const rootComments = [];

      allComments.forEach(comment => {
        commentMap[comment._id.toString()] = { ...comment._doc, replies: [] };
      });

      allComments.forEach(comment => {
        if (comment.parentId) {
          const parentIdStr = comment.parentId.toString();
          if (commentMap[parentIdStr]) {
            commentMap[parentIdStr].replies.push(commentMap[comment._id.toString()]);
          } else {
            rootComments.push(commentMap[comment._id.toString()]);
          }
        } else {
          rootComments.push(commentMap[comment._id.toString()]);
        }
      });
      return rootComments;
    };

    const nestedComments = buildCommentTree(comments);
    res.status(200).json(nestedComments);

  } catch (error) {
    next(error);
  }
};

const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Comment not found'));
    }

    const userIndex = comment.likes.indexOf(req.user.id);

    if (userIndex === -1) {
      comment.numberOfLikes += 1;
      comment.likes.push(req.user.id);
      comment.reaction = 'like';
    } else {
      comment.numberOfLikes = Math.max(0, comment.numberOfLikes - 1);
      comment.likes.splice(userIndex, 1);
      comment.reaction = null;
    }

    await comment.save();
    const populatedComment = await Comment.findById(comment._id).populate('userId', 'username profilePicture _id');
    res.status(200).json(populatedComment || comment);
  } catch (error) {
    next(error);
  }
};

const editComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Comment not found'));
    }
    if (comment.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return next(errorHandler(403, 'You are not allowed to edit this comment'));
    }

    const editedComment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { content: req.body.content },
      { new: true }
    ).populate('userId', 'username profilePicture _id');
    res.status(200).json(editedComment);
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Comment not found'));
    }
    if (comment.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return next(errorHandler(403, 'You are not allowed to delete this comment'));
    }
    await Comment.findByIdAndDelete(req.params.commentId);
    await Comment.deleteMany({ parentId: req.params.commentId });
    res.status(200).json('Comment and its replies have been deleted');
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  if (!req.user.isAdmin)
    return next(errorHandler(403, 'You are not allowed to get all comments'));
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'desc' ? -1 : 1;
    const comments = await Comment.find()
      .populate('userId', 'username profilePicture _id')
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit);
    const totalComments = await Comment.countDocuments();
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastMonthComments = await Comment.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });
    res.status(200).json({ comments, totalComments, lastMonthComments });
  } catch (error) {
    next(error);
  }
};

const addReply = async (req, res, next) => {
  const parentCommentId = req.params.commentId;
  const { reply } = req.body;

  if (!req.user || !req.user.id) {
    return next(errorHandler(401, 'You must be logged in to reply.'));
  }
  if (!reply || typeof reply !== 'string' || reply.trim() === '') {
    return next(errorHandler(400, 'Reply content cannot be empty.'));
  }

  try {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      return next(errorHandler(404, 'Parent comment not found.'));
    }

    const newReplyDocument = new Comment({
      content: reply.trim(),
      postId: parentComment.postId,
      userId: req.user.id,
      parentId: parentCommentId,
      likes: [],
      numberOfLikes: 0,
    });

    await newReplyDocument.save();
    
    const populatedParentComment = await Comment.findById(parentCommentId)
        .populate('userId', 'username profilePicture _id')
        .populate({
            path: 'replies',
            populate: { path: 'userId', select: 'username profilePicture _id' }
        });

    if (populatedParentComment) {
        const newReply = populatedParentComment.replies.find(r => r._id.toString() === newReplyDocument._id.toString());
        if (newReply) {
             return res.status(201).json(newReply);
        }
    }
    
    const finalReply = await Comment.findById(newReplyDocument._id).populate('userId', 'username profilePicture _id');
    res.status(201).json(finalReply || newReplyDocument);

  } catch (error) {
    next(error);
  }
};

module.exports = { createComment, getPostComments, likeComment, editComment, deleteComment, getComments ,addReply };
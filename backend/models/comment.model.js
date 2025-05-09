const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null, 
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User', 
      default: [],
    },
    numberOfLikes: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true } 
);

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;

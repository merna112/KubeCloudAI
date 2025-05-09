import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Comment from './Comment';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default function CommentSection({ postId }) {
  const { currentUser } = useSelector((state) => state.user);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [comments, setComments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const getComments = async () => {
      try {
        const res = await fetch(`/api/comment/getPostComments/${postId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
    getComments();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.length === 0) {
      setCommentError('Comment cannot be empty');
      return;
    } else if (comment.length > 200) {
      setCommentError('Comment cannot exceed 200 characters');
      return;
    }

    try {
      const res = await fetch('/api/comment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          content: comment,
          postId,
          userId: currentUser?._id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setComment('');
        setCommentError(null);
        setComments((prev) => [data, ...prev]);
      } else {
        setCommentError(data.message || 'Failed to add comment');
      }
    } catch (error) {
      setCommentError('Error submitting comment');
      console.error('Comment submission error:', error);
    }
  };

  const handleLike = async (commentId, currentReaction) => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }

    try {
      const res = await fetch(`/api/comment/likeComment/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ reaction: currentReaction ? null : 'like' }), // toggle reaction
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, likes: data.likes, numberOfLikes: data.likes.length, reaction: currentReaction ? null : 'like' }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleEdit = (commentId) => {
    if (editingCommentId === commentId) {
      const updatedComments = comments.map((c) =>
        c._id === commentId ? { ...c, content: editedContent } : c
      );
      setComments(updatedComments);
      setEditingCommentId(null);
      setEditedContent('');
    } else {
      setEditingCommentId(commentId);
      setEditedContent(comments.find((c) => c._id === commentId)?.content || '');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/comment/deleteComment/${commentToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c._id !== commentToDelete));
        setCommentToDelete(null);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReplySubmit = async (parentCommentId) => {
    const replyText = replyContent[parentCommentId];
 
    if (!currentUser) { 
      navigate('/sign-in');
      return;
    }
 
    if (replyText && replyText.trim()) {
      try {
        const res = await fetch(`/api/comment/${parentCommentId}/reply`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`, 
          },
          body: JSON.stringify({
            reply: replyText.trim(),
          }),
        });
 
        if (res.ok) {
          const newReplyData = await res.json(); 
          setComments((prevComments) =>
            prevComments.map((comment) => {
              if (comment._id === parentCommentId) {
                return {
                  ...comment,
                  replies: comment.replies ? [...comment.replies, newReplyData] : [newReplyData],
                };
              }
              return comment;
            })
          );
 
          setReplyContent((prev) => ({ ...prev, [parentCommentId]: '' }));
          setShowReplyBox(null);
        } else {
  
          const errorData = await res.json();
          console.error('Error submitting reply (server):', errorData.message || 'Failed to submit reply');
      
        }
      } catch (error) {
        console.error('Error submitting reply (network/client):', error.message);
      }
    } else {
     
    }
  };
  const handleReplyChange = (commentId, value) => {
    setReplyContent((prev) => ({ ...prev, [commentId]: value }));
  };

  return (
    <>

      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <textarea
          className="w-full p-4 border border-gray-400 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {commentError && <p className="text-red-500 text-sm">{commentError}</p>}
        <button
          type="submit"
          className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700"
        >
          Comment
        </button>
      </form>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment._id} className="border-b py-3">
            <Comment
              comment={comment}
              onLike={(reaction) => handleLike(comment._id, comment.reaction)}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <button onClick={() => handleLike(comment._id, comment.reaction)} className="text-teal-500">
                  👍 {comment.numberOfLikes || 0}
                </button>

                {currentUser && (
                  <div className="flex gap-2">
                    {editingCommentId === comment._id ? (
                      <>
                        <textarea
                          className="border border-gray-400 rounded-md"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                        />
                        <button
                          onClick={() => handleEdit(comment._id)}
                          className="text-green-500"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(comment._id)}
                          className="text-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setShowModal(true);
                            setCommentToDelete(comment._id);
                          }}
                          className="text-red-500"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowReplyBox((prev) => (prev === comment._id ? null : comment._id));
                  }}
                  className="text-blue-500"
                >
                  {showReplyBox === comment._id ? 'Cancel Reply' : 'Reply'}
                </button>
              </div>
            </div>

            {showReplyBox === comment._id && (
              <div className="mt-2">
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Write your reply..."
                  value={replyContent[comment._id] || ''}
                  onChange={(e) => handleReplyChange(comment._id, e.target.value)}
                />
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400"
                    onClick={() => setShowReplyBox(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700"
                    onClick={() => handleReplySubmit(comment._id)}
                  >
                    Submit Reply
                  </button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-4 mt-2 space-y-2">
                {comment.replies.map((reply) => (
                  <Comment
                    key={reply._id}
                    comment={reply}
                    onLike={(reaction) => handleLike(reply._id, reply.reaction)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for deleting a comment */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-md p-4 shadow-lg">
            <h2 className="text-lg font-semibold flex items-center">
              <HiOutlineExclamationCircle className="text-red-500 mr-2" />
              Are you sure you want to delete this comment?
            </h2>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

CommentSection.propTypes = {
  postId: PropTypes.string.isRequired,
};

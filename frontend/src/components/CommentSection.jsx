// CommentSection.jsx
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
  const [showReplyBox, setShowReplyBox] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const navigate = useNavigate();

  const onRequireAuth = () => {
    navigate('/sign-in');
  };

  useEffect(() => {
    const getComments = async () => {
      try {
        const res = await fetch(`/api/comment/getPostComments/${postId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (error) {
        // console.error('Error fetching comments:', error);
      }
    };
    getComments();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
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
    }
  };

  const handleLikeComment = async (commentId, newReaction) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    try {
      const res = await fetch(`/api/comment/likeComment/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ reaction: newReaction }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === commentId) {
              return { ...c, likes: data.likes, numberOfLikes: data.likes.length, reaction: newReaction };
            }
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: c.replies.map(reply =>
                  reply._id === commentId
                    ? { ...reply, likes: data.likes, numberOfLikes: data.likes.length, reaction: newReaction }
                    : reply
                )
              };
            }
            return c;
          })
        );
      }
    } catch (error) {
      // console.error('Error liking comment:', error);
    }
  };

  const handleEditSaveComment = async (commentId, newContent) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    try {
      const res = await fetch(`/api/comment/editComment/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ content: newContent }),
      });
      if (res.ok) {
        const updatedComment = await res.json();
        setComments((prevComments) =>
          prevComments.map((c) => {
            if (c._id === commentId) {
              return updatedComment;
            }
            if (c.replies && c.replies.length > 0) {
                return {
                    ...c,
                    replies: c.replies.map(reply =>
                        reply._id === commentId ? updatedComment : reply
                    )
                };
            }
            return c;
          })
        );
      } else {
        // console.error('Error saving comment edit:', await res.text());
      }
    } catch (error) {
      // console.error('Error saving comment edit:', error.message);
    }
  };

  const handleDeleteRequest = (commentId) => {
    if (!currentUser) {
        onRequireAuth();
        return;
    }
    setShowModal(true);
    setCommentToDelete(commentId);
  };

  const handleDeleteComment = async () => {
    if (!currentUser || !currentUser.token) {
        onRequireAuth();
        setShowModal(false);
        return;
    }
    if (!commentToDelete) return;
    try {
      const res = await fetch(`/api/comment/deleteComment/${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      if (res.ok) {
        setComments((prevComments) =>
          prevComments.reduce((acc, comment) => {
            if (comment._id === commentToDelete) {
              return acc; // Skip the deleted comment
            }
            if (comment.replies && comment.replies.length > 0) {
              const filteredReplies = comment.replies.filter(reply => reply._id !== commentToDelete);
              if (filteredReplies.length !== comment.replies.length) {
                acc.push({ ...comment, replies: filteredReplies });
                return acc;
              }
            }
            acc.push(comment);
            return acc;
          }, [])
        );
      } else {
        // console.error('Error deleting comment:', await res.text());
      }
    } catch (error) {
      // console.error('Error deleting comment:', error);
    } finally {
        setShowModal(false);
        setCommentToDelete(null);
    }
  };

  const handleToggleReplyBox = (commentId) => {
    if (!currentUser) {
        onRequireAuth();
        return;
    }
    setShowReplyBox(prev => prev === commentId ? null : commentId);
    if (showReplyBox !== commentId && !replyContent[commentId]) {
        setReplyContent(prev => ({...prev, [commentId]: ''}));
    }
  };

  const handleReplySubmit = async (parentCommentId) => {
    const replyText = replyContent[parentCommentId];
    if (!currentUser || !currentUser.token) {
      onRequireAuth();
      return;
    }

    if (replyText && replyText.trim()) {
      try {
        const res = await fetch(`/api/comment/${parentCommentId}/reply`, {
          method: 'POST',
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
          // const errorData = await res.json().catch(() => ({ message: 'Failed to submit reply and parse error' }));
          // console.error('Error submitting reply (server):', errorData.message || 'Failed to submit reply');
        }
      } catch (error) {
        // console.error('Error submitting reply (network/client):', error.message);
      }
    }
  };

  const handleReplyChange = (commentId, value) => {
    setReplyContent((prev) => ({ ...prev, [commentId]: value }));
  };

  return (
    <>
      {currentUser && (
        <form onSubmit={handleSubmit} className="space-y-2 mb-4">
            <textarea
            className="w-full p-4 border border-gray-400 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
            />
            {commentError && <p className="text-red-500 text-sm">{commentError}</p>}
            <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
            >
            Comment
            </button>
        </form>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c._id} className="border-b dark:border-gray-700 py-3 last:border-b-0">
            <Comment
              comment={c}
              onLike={(commentId, reaction) => handleLikeComment(commentId, reaction)}
              onEditSave={(commentId, content) => handleEditSaveComment(commentId, content)}
              onDeleteRequest={handleDeleteRequest}
              onReplyRequest={handleToggleReplyBox}
              onRequireAuth={onRequireAuth}
            />

            {showReplyBox === c._id && (
              <div className="mt-3 ml-12 pl-2 border-l-2 dark:border-gray-700">
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  placeholder={`Replying to @${c.userId?.username || 'user'}...`}
                  value={replyContent[c._id] || ''}
                  onChange={(e) => handleReplyChange(c._id, e.target.value)}
                  rows="2"
                />
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400 text-xs dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    onClick={() => setShowReplyBox(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 text-xs"
                    onClick={() => handleReplySubmit(c._id)}
                  >
                    Submit Reply
                  </button>
                </div>
              </div>
            )}

            {c.replies && c.replies.length > 0 && (
              <div className="ml-8 mt-3 space-y-3 pl-4 border-l-2 dark:border-gray-700">
                {c.replies.map((reply) => (
                  <Comment
                    key={reply._id}
                    comment={reply}
                    onLike={(commentId, reaction) => handleLikeComment(commentId, reaction)}
                    onEditSave={(commentId, content) => handleEditSaveComment(commentId, content)}
                    onDeleteRequest={handleDeleteRequest}
                    onReplyRequest={handleToggleReplyBox}
                    onRequireAuth={onRequireAuth}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-md mx-auto">
            <div className="text-center">
                <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this comment?
                </h3>
                <div className="flex justify-center gap-4">
                <button
                    onClick={handleDeleteComment}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                    Yes, I'm sure
                </button>
                <button
                    onClick={() => setShowModal(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 text-sm"
                >
                    No, cancel
                </button>
                </div>
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
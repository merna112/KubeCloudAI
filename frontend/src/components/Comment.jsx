import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { FaThumbsUp as ThumbUpIcon, FaEdit, FaTrashAlt, FaReply } from 'react-icons/fa';

export default function Comment({
  comment,
  onLike,
  onEditSubmit,
  onDelete,
  onReplySubmit,
  isReply = false,
  onRequireAuth,
}) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchCommentUser = async () => {
      if (!comment.userId) {
        setUser({ username: 'Unknown User', profilePicture: '/default-profile.png' });
        return;
      }
      if (typeof comment.userId === 'object' && comment.userId !== null && comment.userId.username) {
        setUser(comment.userId);
        return;
      }
      const userIdToFetch = typeof comment.userId === 'object' ? comment.userId._id : comment.userId;
      if (!userIdToFetch) {
        setUser({ username: 'User ID Error', profilePicture: '/default-profile.png' });
        return;
      }
      try {
        const res = await fetch(`/api/user/${userIdToFetch}`);
        if (!res.ok) {
          setUser({ username: 'User Not Found', profilePicture: '/default-profile.png' });
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (error) {
        setUser({ username: 'Error Loading User', profilePicture: '/default-profile.png' });
      }
    };
    fetchCommentUser();
  }, [comment.userId]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!currentUser) { if (onRequireAuth) onRequireAuth(); return; }
    if (editedContent.trim() === '') return;
    await onEditSubmit(comment._id, editedContent.trim());
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!currentUser) { if (onRequireAuth) onRequireAuth(); return; }
    onDelete(comment._id);
  };

  const handleToggleReplyForm = () => {
    if (!currentUser) { if (onRequireAuth) onRequireAuth(); return; }
    setShowReplyForm(!showReplyForm);
  };

  const handleLocalReplySubmit = () => {
    if (!currentUser) { if (onRequireAuth) onRequireAuth(); return; }
    if (replyContent.trim() === '') return;
    onReplySubmit(comment._id, replyContent.trim());
    setReplyContent('');
    setShowReplyForm(false);
  };
  
  const handleLikeClick = () => {
    if (!currentUser) { if (onRequireAuth) onRequireAuth(); return; }
    onLike(comment._id);
  };

  const commentAuthorId = typeof comment.userId === 'object' && comment.userId !== null ? comment.userId._id : comment.userId;
  const canEditOrDelete = currentUser && (currentUser._id === commentAuthorId || currentUser.isAdmin);

  return (
    <div className={`flex flex-col p-3 border-b dark:border-gray-700 text-sm ${isReply ? 'ml-4 bg-gray-50 dark:bg-gray-700 rounded-md mt-2' : 'my-2'}`}>
      <div className="flex items-start">
        <img
          className="w-8 h-8 rounded-full bg-gray-200 mr-3"
          src={user?.profilePicture || '/default-profile.png'}
          alt={user?.username || 'User'}
        />
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <span className="font-bold mr-1 text-xs truncate">
              {user?.username ? `@${user.username}` : 'Anonymous user'}
            </span>
            <span className="text-gray-500 text-xs">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          {isEditing && canEditOrDelete ? (
            <>
              <textarea
                className="w-full mb-2 p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white focus:ring-cyan-500 focus:border-cyan-500"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2 text-xs">
                <button type="button" className="text-green-500 hover:underline font-medium" onClick={handleSaveEdit}>Save</button>
                <button type="button" className="text-gray-500 hover:underline font-medium" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 pb-2 break-words">{comment.content}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <button
              type="button"
              onClick={handleLikeClick}
              className={`hover:text-blue-600 flex items-center ${comment.likes?.includes(currentUser?._id) ? 'text-blue-700 dark:text-blue-500' : 'dark:hover:text-blue-400'}`}
              title="Like"
            >
              <ThumbUpIcon className="w-3.5 h-3.5 mr-1" />
              {comment.numberOfLikes > 0 && (
                <span>{comment.numberOfLikes}</span>
              )}
            </button>
            
            {currentUser && (
                <button type="button" className="hover:underline dark:hover:text-gray-200" onClick={handleToggleReplyForm}>
                    Reply
                </button>
            )}

            {canEditOrDelete && (
              <>
                <button type="button" className="hover:underline dark:hover:text-gray-200" onClick={handleEdit}>Edit</button>
                <button type="button" className="hover:underline text-red-500 dark:hover:text-red-400" onClick={handleDelete}>Delete</button>
              </>
            )}
          </div>

          {showReplyForm && currentUser && (
            <div className="mt-3">
              <textarea
                className="w-full p-2 text-sm border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-md dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                placeholder={`Replying to @${user?.username || 'user'}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
              />
              <div className="flex justify-end mt-2 gap-2">
                <button
                  type="button"
                  className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600"
                  onClick={handleLocalReplySubmit}
                >
                  Submit Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Comment.propTypes = {
  comment: PropTypes.object.isRequired,
  onLike: PropTypes.func.isRequired,
  onEditSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReplySubmit: PropTypes.func.isRequired,
  isReply: PropTypes.bool,
  onRequireAuth: PropTypes.func,
};
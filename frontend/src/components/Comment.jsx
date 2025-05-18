import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { FaThumbsUp as ThumbUpIcon, FaEdit, FaTrash, FaReply } from 'react-icons/fa';

export default function Comment({ comment, onLike, onEditSave, onDeleteRequest, onReplyRequest, onRequireAuth }) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchCommentUser = async () => {
      if (!comment.userId) {
        setUser({ username: 'Unknown User', profilePicture: '/default-profile.png' });
        return;
      }
      let userIdToFetch;
      if (typeof comment.userId === 'object' && comment.userId !== null) {
        if (comment.userId.username && typeof comment.userId.profilePicture !== 'undefined') {
          setUser(comment.userId);
          return;
        }
        userIdToFetch = comment.userId._id;
      } else if (typeof comment.userId === 'string') {
        userIdToFetch = comment.userId;
      } else {
        setUser({ username: 'Invalid User Data', profilePicture: '/default-profile.png' });
        return;
      }

      if (!userIdToFetch) {
        setUser({ username: 'User ID Error', profilePicture: '/default-profile.png' });
        return;
      }

      try {
        const res = await fetch(`/api/user/${userIdToFetch}`);
        if (!res.ok) {
          if (res.status === 404) {
            setUser({ username: 'User Not Found', profilePicture: '/default-profile.png' });
          } else {
            throw new Error(`Failed to fetch user: ${res.status}`);
          }
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (error) {
        setUser({ username: 'Error Loading User', profilePicture: '/default-profile.png' });
      }
    };
    fetchCommentUser();
  }, [comment.userId, comment._id]);

  const commentAuthorId = (typeof comment.userId === 'object' && comment.userId !== null) ? comment.userId._id : comment.userId;
  const isOwner = currentUser && commentAuthorId && currentUser._id === commentAuthorId;
  const isAdmin = currentUser && currentUser.isAdmin;
  const canEditDelete = isOwner || isAdmin;

  const handleEditClick = () => {
    if (!currentUser) {
        onRequireAuth();
        return;
    }
    setIsEditing(true);
    setEditedContent(comment.content);
  };

  const handleSaveClick = () => {
    if (!currentUser) {
        onRequireAuth();
        return;
    }
    onEditSave(comment._id, editedContent);
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
     if (!currentUser) {
        onRequireAuth();
        return;
    }
    onDeleteRequest(comment._id);
  };

  const handleLikeClick = () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    const newReaction = comment.reaction === 'like' ? null : 'like';
    onLike(comment._id, newReaction);
  };

  const handleReplyClick = () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    onReplyRequest(comment._id);
  };

  return (
    <div className="flex flex-col p-4 border-b dark:border-gray-600 text-sm">
      <div className="flex-shrink-0 mb-2">
        <img
          className="w-10 h-10 rounded-full bg-gray-200"
          src={user?.profilePicture || '/default-profile.png'}
          alt={user?.username || 'User'}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center mb-1">
          <span className="font-bold mr-1 text-xs truncate">
            {user ? (user.username !== 'Unknown User' && user.username !== 'User Not Found' && user.username !== 'Error Loading User' && user.username !== 'Invalid User Data' && user.username !== 'User ID Error' ? `@${user.username}` : user.username) : 'Loading user...'}
          </span>
          <span className="text-gray-500 text-xs ml-1">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        {isEditing ? (
          <>
            <textarea
              className="w-full mb-2 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 text-xs"
                onClick={handleSaveClick}
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 text-xs"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 pb-2 whitespace-pre-line">{comment.content}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <button
              onClick={handleLikeClick}
              className={`flex items-center hover:text-purple-600 ${comment.reaction === 'like' ? 'text-purple-600' : ''}`}
            >
              <ThumbUpIcon className={`w-4 h-4 mr-1 ${comment.reaction === 'like' ? 'fill-current' : ''}`} />
              Like ({comment.numberOfLikes || 0})
            </button>
            
            <button onClick={handleReplyClick} className="flex items-center hover:text-purple-600">
                <FaReply className="w-4 h-4 mr-1" /> Reply
            </button>

            {canEditDelete && (
              <>
                <button onClick={handleEditClick} className="flex items-center hover:text-blue-500">
                    <FaEdit className="w-4 h-4 mr-1" /> Edit
                </button>
                <button onClick={handleDeleteClick} className="flex items-center hover:text-red-500">
                    <FaTrash className="w-4 h-4 mr-1" /> Delete
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  );
}

Comment.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    reaction: PropTypes.string,
    numberOfLikes: PropTypes.number,
  }).isRequired,
  onLike: PropTypes.func.isRequired,
  onEditSave: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
  onReplyRequest: PropTypes.func.isRequired,
  onRequireAuth: PropTypes.func.isRequired,
};
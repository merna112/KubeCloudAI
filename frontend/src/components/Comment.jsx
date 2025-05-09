import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { FaThumbsUp as ThumbUp } from 'react-icons/fa';

const reactions = [
  { type: 'like', icon: <ThumbUp className="w-6 h-6" />, label: 'Like' },
];

export default function Comment({ comment, onLike, onEdit, onDelete }) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [reactionsVisible, setReactionsVisible] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(comment.reaction);
  const [likeCount, setLikeCount] = useState(comment.numberOfLikes);
  const { currentUser } = useSelector((state) => state.user);

useEffect(() => {
  const fetchCommentUser = async () => {
    if (!comment.userId) {
      setUser({ username: 'Unknown User', profilePicture: '/default-profile.png' });
      return;
    }

    try {

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
        console.error("Unexpected type for comment.userId:", comment.userId, "for comment:", comment._id);
        setUser({ username: 'Invalid User Data', profilePicture: '/default-profile.png' });
        return;
      }

      if (!userIdToFetch) {
        console.error("userIdToFetch is undefined for comment:", comment._id);
        setUser({ username: 'User ID Error', profilePicture: '/default-profile.png' });
        return;
      }

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
      console.error(`Error fetching user data for comment ${comment._id}:`, error.message);
      setUser({ username: 'Error Loading User', profilePicture: '/default-profile.png' });
    }
  };

  fetchCommentUser();
}, [comment.userId, comment._id]);

  useEffect(() => {
    setCurrentReaction(comment.reaction);
    setLikeCount(comment.numberOfLikes);
  }, [comment.reaction, comment.numberOfLikes]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(comment.content);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/comment/editComment/${comment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });
      if (res.ok) {
        setIsEditing(false);
        onEdit(comment._id, editedContent);
      }
    } catch (error) {
      console.error('Error saving comment:', error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/comment/deleteComment/${comment._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDelete(comment._id);
      } else {
        console.error('Error deleting comment:', await res.text());
      }
    } catch (error) {
      console.error('Error deleting comment:', error.message);
    }
  };

  const handleReaction = async (reaction) => {
    if (reaction === currentReaction) {
      setCurrentReaction(null);
      setLikeCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 0));
      await onLike(comment._id, null);
    } else {
      setCurrentReaction(reaction);
      setLikeCount((prevCount) => prevCount + 1);
      await onLike(comment._id, reaction);
    }
    setReactionsVisible(false);
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
            {user?.username ? `@${user.username}` : 'Anonymous user'}
          </span>
          <span className="text-gray-500 text-xs">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        {isEditing ? (
          <>
            <textarea
              className="w-full mb-2 p-2 border border-gray-300 rounded-md"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-500 pb-2">{comment.content}</p>
        
          </>
        )}
        <div className="mt-3">
          {reactionsVisible && (
            <div className="flex gap-2">
              {reactions.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  className={`flex items-center p-2 ${
                    currentReaction === reaction.type ? 'text-purple-600' : 'text-gray-400'
                  } hover:text-purple-600`}
                >
                  {reaction.icon}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Comment.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    reaction: PropTypes.string,
    numberOfLikes: PropTypes.number,
  }).isRequired,
  onLike: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

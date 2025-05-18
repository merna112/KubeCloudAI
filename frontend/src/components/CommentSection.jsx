import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Comment from './Comment';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default function CommentSection({ postId }) {
  const { currentUser } = useSelector((state) => state.user);
  const [commentContent, setCommentContent] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [comments, setComments] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState(null);
  const navigate = useNavigate();

  const fetchAndBuildTree = useCallback(async () => {
    try {
      const res = await fetch(`/api/comment/getPostComments/${postId}`);
      if (res.ok) {
        const flatComments = await res.json();
        const commentMap = {};
        const tree = [];
        (flatComments || []).forEach(comment => {
          commentMap[comment._id] = { ...comment, replies: [] };
        });
        (flatComments || []).forEach(comment => {
          if (comment.parentId && commentMap[comment.parentId]) {
            commentMap[comment.parentId].replies.push(commentMap[comment._id]);
            commentMap[comment.parentId].replies.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
          } else if (!comment.parentId) {
            tree.push(commentMap[comment._id]);
          }
        });
        tree.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setComments(tree);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  }, [postId]);

  useEffect(() => {
    fetchAndBuildTree();
  }, [postId, fetchAndBuildTree]);

  const handleMainCommentSubmit = async (e) => {
    e.preventDefault();
    if (commentContent.length === 0 || commentContent.length > 200) {
      setCommentError('Comment must be between 1 and 200 characters.');
      return;
    }
    if (!currentUser) { navigate('/sign-in'); return; }
    try {
      const res = await fetch('/api/comment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent, postId, userId: currentUser._id }),
      });
      if (res.ok) {
        setCommentContent('');
        setCommentError(null);
        fetchAndBuildTree();
      } else {
        const data = await res.json();
        setCommentError(data.message || 'Failed to add comment');
      }
    } catch (error) {
      setCommentError('Error submitting comment');
      console.error('Error submitting comment:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUser) { navigate('/sign-in'); return; }
    try {
      const res = await fetch(`/api/comment/likeComment/${commentId}`, { method: 'PUT' });
      if (res.ok) {
        fetchAndBuildTree();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    if (!currentUser) { navigate('/sign-in'); return; }
    try {
      const res = await fetch(`/api/comment/editComment/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
      if (res.ok) {
        fetchAndBuildTree();
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const openDeleteModal = (commentId) => {
    if (!currentUser) { navigate('/sign-in'); return; }
    setShowDeleteModal(true);
    setCommentIdToDelete(commentId);
  };

  const handleDeleteComment = async () => {
    if (!currentUser || !commentIdToDelete) return;
    try {
      const res = await fetch(`/api/comment/deleteComment/${commentIdToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAndBuildTree();
        setShowDeleteModal(false);
        setCommentIdToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReplyToComment = async (parentCommentId, replyText) => {
    if (!currentUser) { navigate('/sign-in'); return; }
    if (!replyText || replyText.trim() === '') return;
    try {
      const res = await fetch(`/api/comment/${parentCommentId}/reply`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (res.ok) {
        fetchAndBuildTree();
      } else {
        const errorData = await res.json();
        console.error('Error submitting reply (server):', errorData.message || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const RenderComments = ({ commentList, isReplyLayer = false }) => {
    if (!commentList || commentList.length === 0) return null;
    return (
      <div className={isReplyLayer ? "ml-5 pl-5 border-l-2 dark:border-gray-700" : ""}>
        {commentList.map((c) => (
          <div key={c._id} className="my-0">
            <Comment
              comment={c}
              onLike={handleLikeComment}
              onEditSubmit={handleEditComment}
              onDelete={openDeleteModal}
              onReplySubmit={handleReplyToComment}
              isReply={isReplyLayer}
              onRequireAuth={() => navigate('/sign-in')}
            />
            {c.replies && c.replies.length > 0 && (
              <RenderComments commentList={c.replies} isReplyLayer={true} />
            )}
          </div>
        ))}
      </div>
    );
  };
  RenderComments.propTypes = {
    commentList: PropTypes.array.isRequired,
    isReplyLayer: PropTypes.bool
  };


  const countAllComments = (commentsToCount) => {
    let count = 0;
    function counter(items) {
      items.forEach(item => {
        count++;
        if (item.replies && item.replies.length > 0) {
          counter(item.replies);
        }
      });
    }
    counter(commentsToCount);
    return count;
  };


  return (
    <div className="max-w-2xl mx-auto w-full p-3">
      {currentUser && (
        <p className="text-gray-500 text-sm my-2">
          Signed in as: <span className="text-cyan-600 hover:underline">@{currentUser.username}</span>
        </p>
      )}
      <form onSubmit={handleMainCommentSubmit} className="border border-teal-500 rounded-md p-3 mb-6">
        <textarea
          placeholder="Add a comment..."
          rows="3"
          maxLength="200"
          onChange={(e) => setCommentContent(e.target.value)}
          value={commentContent}
          className="w-full p-2 text-sm border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-gray-500 text-xs">{200 - commentContent.length} characters remaining</p>
          <button type="submit" className="outline_btn_Small">Submit</button>
        </div>
        {commentError && <p className="mt-2 text-red-500 text-xs">{commentError}</p>}
      </form>

      {comments && comments.length > 0 ? (
        <>
          <div className="text-sm my-5 flex items-center gap-1">
            <p>Comments</p>
            <div className="border border-gray-400 py-1 px-2 rounded-sm">
              <p>{countAllComments(comments)}</p>
            </div>
          </div>
          <RenderComments commentList={comments} />
        </>
      ) : (
        <p className="text-sm text-gray-500 my-5">No comments yet.</p>
      )}

      {showDeleteModal && (
         <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center">
           <div className="relative p-4 w-full max-w-md h-full md:h-auto">
             <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
               <div className="p-6 text-center">
                 <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                 <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                   Are you sure you want to delete this comment and all its replies?
                 </h3>
                 <div className="flex justify-center gap-4">
                   <button onClick={handleDeleteComment} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                     Yes, I'm sure
                   </button>
                   <button onClick={() => setShowDeleteModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                     No, cancel
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}

CommentSection.propTypes = {
  postId: PropTypes.string.isRequired,
};
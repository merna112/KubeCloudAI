import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

const Spinner = () => (
  <svg className="animate-spin h-8 w-8 text-sky-600 dark:text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function DashComments() {
  const { currentUser } = useSelector((state) => state.user);
  const [comments, setComments] = useState([]);
  const [showMore, setShowMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/comment/getcomments`);
        const data = await res.json();
        if (res.ok) {
          setComments(data.comments);
          setShowMore(data.comments.length >= 9);
        } else {
          setComments([]);
          setShowMore(false);
        }
      } catch (error) {
        console.error("Error fetching comments:", error.message);
        setComments([]);
        setShowMore(false);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && currentUser.isAdmin) {
      fetchComments();
    } else {
      setComments([]);
      setShowMore(false);
      setLoading(false); 
    }
  }, [currentUser]); 

  const handleShowMore = async () => {
    const startIndex = comments.length;
    try {
      const res = await fetch(
        `/api/comment/getcomments?startIndex=${startIndex}`
      );
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [...prev, ...data.comments]);
        if (data.comments.length < 9) {
          setShowMore(false);
        }
      }
    } catch (error) {
      console.log(error.message); 
    }
  };

  const handleDeleteComment = async () => {
    setShowModal(false);
    try {
      const res = await fetch(
        `/api/comment/deleteComment/${commentIdToDelete}`,
        {
          method: 'DELETE',
        }
      );
      const data = await res.json();
      if (res.ok) {
        setComments((prev) =>
          prev.filter((comment) => comment._id !== commentIdToDelete)
        );
      } else {
        console.log(data.message); 
      }
    } catch (error) {
      console.log(error.message); 
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen py-10 dark:bg-gray-900">
        <Spinner />
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen py-10 dark:bg-gray-900">
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
          You are not authorized to view comments.
        </p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen py-10 dark:bg-gray-900">
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
          No comments found.
        </p>
      </div>
    );
  }

  return (
    <div className='px-2 py-4 sm:px-4 md:p-6 w-full mx-auto dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen'>
      <div className="hidden md:block shadow-md rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className='min-w-full w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-700/50'>
            <tr>
              <th scope='col' className='px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap'>
                Date Updated
              </th>
              <th scope='col' className='px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider'>
                Comment Content
              </th>
              <th scope='col' className='px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap'>
                Likes
              </th>
              <th scope='col' className='px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap'>
                Post ID
              </th>
              <th scope='col' className='px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap'>
                User
              </th>
              <th scope='col' className='px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap'>
                User ID
              </th>
              <th scope='col' className='px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap'>
                Action
              </th>
            </tr>
          </thead>
          <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
            {comments.map((comment) => (
              <tr key={comment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300'>
                  {new Date(comment.updatedAt).toLocaleDateString()}
                </td>
                <td className='px-3 py-4 text-sm text-gray-800 dark:text-gray-200 break-words max-w-xs'>
                  {comment.content}
                </td>
                <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center'>
                  {comment.numberOfLikes}
                </td>
                <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300'>
                  {comment.postId}
                </td>
                <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300'>
                  <div className="flex items-center">
                    {comment.userId?.profilePicture && (
                      <img
                        src={comment.userId.profilePicture}
                        alt={comment.userId.username || ''}
                        className="h-8 w-8 rounded-full mr-2 object-cover"
                      />
                    )}
                    <span>{comment.userId?.username || 'Unknown User'}</span>
                  </div>
                </td>
                <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300'>
                  {comment.userId?._id || 'N/A'}
                </td>
                <td className='px-3 py-4 whitespace-nowrap text-sm'>
                  <button
                    onClick={() => {
                      setShowModal(true);
                      setCommentIdToDelete(comment._id);
                    }}
                    className='font-medium text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 hover:underline focus:outline-none'
                    aria-label={`Delete comment by user ${comment.userId?.username || comment.userId?._id || 'Unknown'}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="mb-3">
              <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Comment:</span>
              <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{comment.content}</p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Date:</span>
                <p className="text-gray-700 dark:text-gray-300">{new Date(comment.updatedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Likes:</span>
                <p className="text-gray-700 dark:text-gray-300">{comment.numberOfLikes}</p>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Post ID:</span>
                <p className="text-gray-700 dark:text-gray-300 truncate" title={comment.postId}>{comment.postId}</p>
              </div>
              <div className="col-span-2">
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">User:</span>
                {comment.userId ? (
                  <div className="flex items-center mt-1">
                    {comment.userId.profilePicture && (
                      <img
                        src={comment.userId.profilePicture}
                        alt={comment.userId.username || ''}
                        className="h-8 w-8 rounded-full mr-2 object-cover"
                      />
                    )}
                    <div className="text-sm">
                      <p className="text-gray-800 dark:text-gray-200 font-medium">{comment.userId.username || 'Unknown User'}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs truncate" title={comment.userId._id}>
                        ID: {comment.userId._id || 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">Unavailable</p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setShowModal(true);
                setCommentIdToDelete(comment._id);
              }}
              className='w-full mt-2 font-medium text-red-600 bg-red-50 dark:bg-red-700/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-700/40 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-60 transition-colors'
            >
              Delete Comment
            </button>
          </div>
        ))}
      </div>

      {showMore && (
        <button
          onClick={handleShowMore}
          className='w-full text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium py-3 mt-6 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 rounded-md'
        >
          Show more
        </button>
      )}

      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-opacity duration-300 ease-in-out'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 sm:p-6 max-w-md w-full transform transition-all duration-300 ease-in-out scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100' data-state={showModal ? "open" : "closed"}>
            <div className="text-center">
              <HiOutlineExclamationCircle className='h-12 w-12 sm:h-14 sm:w-14 text-gray-400 dark:text-gray-500 mb-4 mx-auto' />
              <h3 className='mb-2 text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100'>
                Confirm Deletion
              </h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
            </div>
            <div className='flex flex-col sm:flex-row-reverse justify-center gap-3'>
              <button
                onClick={handleDeleteComment}
                className='w-full sm:w-auto bg-red-600 text-white py-2.5 px-5 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors font-medium'
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowModal(false)}
                className='w-full sm:w-auto bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors font-medium'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
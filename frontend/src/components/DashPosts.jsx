import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { FaEdit, FaTrash } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

export default function DashPosts() {
  const { currentUser } = useSelector((state) => state.user);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const limit = 9;

  // Fetch posts function
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const token = currentUser.token;
      const res = await fetch(`/api/post/getposts?userId=${currentUser._id}&startIndex=${startIndex}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUserPosts((prevPosts) => startIndex === 0 ? data.posts : [...prevPosts, ...data.posts]);
        setShowMore(data.posts.length === limit);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, startIndex]);

  useEffect(() => {
    if (currentUser && currentUser.isAdmin) {
      fetchPosts();
    }
  }, [currentUser, startIndex, fetchPosts]);

  const handleDelete = (postId) => {
    setPostToDelete(postId);
    setShowModal(true);
  };

  const handleDeletePost = async () => {
    setShowModal(false);
    try {
      const token = currentUser?.token;
      if (!token) {
        console.error('Token is missing');
        alert('Authentication error: Please log in again.');
        return;
      }

      const res = await fetch(`/api/post/deletepost/${postToDelete}/${currentUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(`Failed to delete post: ${data.message}`);
        alert(`Failed to delete post: ${data.message}`);
      } else {
        setUserPosts((prevPosts) => prevPosts.filter(post => post._id !== postToDelete));
        if (userPosts.length <= limit && startIndex > 0) {
          setStartIndex((prevIndex) => Math.max(prevIndex - limit, 0));
          fetchPosts(); // Refetch to update post list
        }
      }
    } catch (error) {
      console.error('Error while deleting post:', error.message);
      alert('An error occurred while deleting the post. Please try again later.');
    }
  };

  const handleShowMore = () => {
    setStartIndex((prevIndex) => prevIndex + limit);
  };

  const renderContent = () => {
    if (loading) return <p className="text-center text-gray-600">Loading...</p>;
    if (userPosts.length === 0) return <p className="text-center text-gray-600">You have no posts yet!</p>;

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {userPosts.map((post) => (
            <div key={post._id} className="relative bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:shadow-xl hover:scale-105">
              <Link to={`/post/${post._id}`} className="block">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800 truncate">{post.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{post.category}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Updated {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
              <div className="absolute inset-x-0 bottom-0 bg-gray-100 border-t border-gray-200 flex justify-between items-center p-2">
                <Link
                  to={`/update-post/${post._id}`}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition duration-150"
                >
                  <FaEdit className="mr-1" /> Edit
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleDelete(post._id);
                  }}
                  className="flex items-center text-red-600 hover:text-red-800 transition duration-150"
                >
                  <FaTrash className="mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {showMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleShowMore}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Show More
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-100 text-gray-800 rounded-lg shadow-md">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-800">Manage Posts</h1>
      {renderContent()}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

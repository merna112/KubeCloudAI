import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaTrash, FaUserShield } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

export default function DashUsers() {
  const { currentUser } = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const limit = 9;

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) return;
  
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
  
      try {
        const token = currentUser.token; 
        if (!token) {
          console.error("DashUsers: Token is missing from currentUser!");
          setError("Authentication token is missing. Please log in again.");
          setLoading(false);
          return;
        }
        console.log("DashUsers: Sending token:", token); 
  
        const res = await fetch(`/api/user/getusers?startIndex=${startIndex}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`, 
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch users');
        }

        const data = await res.json();
        setUsers(prevUsers => [...prevUsers, ...data.users]);
        setShowMore(data.users.length > 0 && (startIndex + limit < data.total)); 
      } catch (err) {
        setError(err.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, startIndex,limit]);

  const handleDelete = (userId) => {
    setUserToDelete(userId);
    setShowModal(true);
  };

  const handleDeleteUser = async () => {
    setShowModal(false);
    try {
      const token = currentUser.token;
      if (!token) {
        alert('Authentication error: Please log in again.');
        return;
      }
  
      const res = await fetch(`/api/user/delete/${userToDelete}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to delete user');
        } catch {
          throw new Error('Failed to delete user. Response: ' + errorText);
        }
      }
  
      // Successfully deleted user
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userToDelete));
      setShowMore(prevCount => prevCount > limit); 
    } catch (error) {
      console.error('Error while deleting user:', error.message);
      alert(`Error while deleting user: ${error.message}`);
    }
  };
  

  const handleShowMore = () => {
    setStartIndex(prevIndex => prevIndex + limit);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-100 text-gray-800 rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">Manage Users</h1>

      {loading && <p className="text-center text-gray-600">Loading...</p>}
      {error && <p className="text-center text-red-600">Error: {error}</p>}

      {users.length === 0 && !loading && !error ? (
        <p className="text-center text-gray-600">No users found!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {users.map(user => (
            <div key={user._id} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden transition transform hover:scale-105 duration-300">
              <div className="flex items-center p-4">
                <img
                  src={user.profilePicture || '/default-profile.png'}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-gray-300"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                  <p className="text-sm text-gray-600 mt-2">{user.email}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Created {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </p>
                  {user.isAdmin && (
                    <p className="flex items-center text-sm text-blue-500 mt-2">
                      <FaUserShield className="mr-1" /> Admin
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => handleDelete(user._id)}
                  className="flex items-center text-red-500 hover:text-red-700 transition duration-200"
                >
                  <FaTrash className="mr-2" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showMore && !loading && !error && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleShowMore}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Show More
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold text-gray-800">Are you sure?</h3>
            <p className="text-sm text-gray-600 mt-2">This action cannot be undone. Are you sure you want to delete this user?</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
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

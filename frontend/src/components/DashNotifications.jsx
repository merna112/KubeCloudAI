import { useEffect, useState } from 'react';

export default function DashNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState({ docs: [] });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/notifications', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
        console.log('Fetched Notifications:', JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('Error fetching notifications:', error.message);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/users/getusers', { 
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json(); 
     
        if (data && Array.isArray(data.users)) {
          setUsers({ docs: data.users }); 
        } else {
          console.warn('Fetched user data from /api/users/getusers is not in the expected format:', data);
          setUsers({ docs: [] }); 
        }
        console.log('Fetched Users (from /api/users/getusers):', JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('Error fetching users:', error.message);
        setUsers({ docs: [] }); 
      }
    };

    fetchNotifications();
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      setNotifications(notifications.filter(notification => notification._id !== id));
      console.log('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error.message);
    }
  };

  const userDocsArray = Array.isArray(users?.docs) ? users.docs : [];

  return (
    <div className='bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col items-center py-6 px-2 sm:px-6 lg:px-8'>
      <div className='w-full max-w-3xl bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden'>
        <div className='relative'>
          <img
            src='https://source.unsplash.com/random/1200x500?technology,notifications'
            alt='Notifications Header'
            className='w-full h-48 sm:h-64 object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent'></div>
          <div className='absolute bottom-0 left-0 p-4 sm:p-6'>
            <h1 className='text-2xl sm:text-3xl md:text-4xl font-bold text-white'>
              Your Notifications
            </h1>
          </div>
        </div>
        <div className='p-4 sm:p-6 md:p-8'>
          {notifications.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-10 text-lg">
              No notifications found!
            </p>
          ) : (
            <ul className='space-y-4 sm:space-y-6'>
              {notifications.map(notification => {
                console.log(`Processing Notification ID: ${notification._id}, looking for user ID: ${notification.user}`);
                const user = userDocsArray.find(u => u._id === notification.user) || {};
                if (!user.username) {
                  console.log(`User NOT FOUND for notification.user: ${notification.user}. User object from find:`, user);
                } else {
                  console.log(`User FOUND: ${user.username}, Email: ${user.email}, Picture: ${user.profilePicture}`);
                }
                
                return (
                  <li 
                    key={notification._id} 
                    className='p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300'
                  >
                    <div className='flex items-start sm:items-center mb-3'>
                      <img
                        src={user.profilePicture || '/default-profile.png'}
                        alt={user.username || 'User'}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mr-3 sm:mr-4 border-2 border-gray-300 dark:border-gray-500 flex-shrink-0"
                      />
                      <div className='flex-grow'>
                        <p className='text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200'>
                          {user.username || 'Anonymous user'}
                        </p>
                        <p className='text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all'>
                          {user.email || 'No email available'}
                        </p>
                      </div>
                    </div>
                    <p className='text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-3 leading-relaxed'>
                      {notification.message}
                    </p>
                    <div className='flex justify-between items-center text-xs sm:text-sm'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        {new Date(notification.timestamp).toLocaleDateString()} - {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className='text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition-colors duration-200 px-3 py-1 rounded hover:bg-red-100 dark:hover:bg-red-700/30'
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
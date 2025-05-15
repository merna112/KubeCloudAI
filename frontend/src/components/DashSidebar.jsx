import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaClipboardList, FaUsers, FaComments, FaHome, FaBell, FaBars, FaTimes } from 'react-icons/fa';
import { signoutSuccess } from '../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const DashSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (tab) => location.search.includes(tab);
  const { currentUser } = useSelector((state) => state.user);
  const isAdmin = currentUser?.isAdmin || false;

  const handleSignOut = async () => {
    try {
      const res = await axios.post('/api/user/signout');
      if (res.status === 200) {
        dispatch(signoutSuccess());
        navigate('/sign-in');
      } else {
        console.log(res.data.message);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4 text-lg font-semibold border-b border-gray-700 flex items-center">
        <FaHome className="mr-2" />
        Dashboard
      </div>
      <nav className="mt-4">
        <ul>
          <li>
            <Link
              to="/dashboard?tab=profile"
              className={`flex items-center px-4 py-2 rounded transition duration-200 ${
                isActive('profile') ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <FaUser className="mr-2" /> Profile
            </Link>
          </li>
          {isAdmin && (
            <>
              <li>
                <Link
                  to="/dashboard?tab=overview"
                  className={`flex items-center px-4 py-2 rounded transition duration-200 ${
                    isActive('overview') ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaHome className="mr-2" /> Overview
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard?tab=posts"
                  className={`flex items-center px-4 py-2 rounded transition duration-200 ${
                    isActive('posts') ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaClipboardList className="mr-2" /> Posts
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard?tab=users"
                  className={`flex items-center px-4 py-2 rounded transition duration-200 ${
                    isActive('users') ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaUsers className="mr-2" /> Users
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard?tab=comments"
                  className={`flex items-center px-4 py-2 rounded transition duration-200 ${
                    isActive('comments') ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaComments className="mr-2" /> Comments
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard?tab=notifications"
                  className={`flex items-center px-4 py-2 rounded transition duration-200 ${
                    isActive('notifications') ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaBell className="mr-2" /> Notifications
                </Link>
              </li>
            </>
          )}
          <li>
            <Link
              to="/sign-in"
              className="flex items-center px-4 py-2 hover:bg-gray-700 rounded transition duration-200"
              onClick={() => {
                handleSignOut();
                setSidebarOpen(false);
              }}
            >
              <FaSignOutAlt className="mr-2" /> Sign Out
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden p-4 bg-gray-800 text-white flex justify-between items-center">
        <span className="text-lg font-bold">Dashboard</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden md:block w-64 h-screen bg-gray-800 text-white fixed">
        {sidebarContent}
      </div>

      {/* Sidebar for mobile with slide animation */}
      <div
        className={`fixed inset-0 z-50 flex md:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar panel */}
        <div className="w-64 h-full bg-gray-800 text-white p-4 shadow-lg">
          {sidebarContent}
        </div>

        {/* Overlay to close when clicking outside */}
        <div
          className="flex-1 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      </div>
    </>
  );
};

export default DashSidebar;

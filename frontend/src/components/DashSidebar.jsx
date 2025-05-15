import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaClipboardList, FaUsers, FaComments, FaHome, FaBell, FaBars, FaTimes } from 'react-icons/fa';
import { signoutSuccess } from '../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DashSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { currentUser } = useSelector((state) => state.user);
  const isAdmin = currentUser?.isAdmin || false;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { 
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (tab) => location.search.includes(tab);

  const handleSignOut = async () => {
    try {
      const res = await axios.post('/api/user/signout');
      const data = res.data;

      if (res.status !== 200) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
        navigate('/sign-in');
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const sidebarBaseClasses = "bg-gray-800 text-white flex flex-col";
  const mobileTransformClasses = isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full';
  const mobileClasses = `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${mobileTransformClasses}`;
  const desktopClasses = "md:sticky md:top-0 md:translate-x-0 md:w-64 md:h-screen";

  return (
    <>
      {!isMobileMenuOpen && (
        <button
          onClick={toggleMobileMenu}
          className="md:hidden fixed top-4 left-4 z-[51] p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="Open menu"
        >
          <FaBars size={20} />
        </button>
      )}

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black opacity-50 md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        ></div>
      )}

      <div
        className={`${sidebarBaseClasses} ${mobileClasses} ${desktopClasses} overflow-y-auto`}
      >
        <div className="p-4 text-lg font-semibold border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <FaHome className="mr-2" />
            Dashboard
          </div>
          {isMobileMenuOpen && (
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-white p-1 hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Close menu"
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>

        <nav className="mt-4 flex-grow">
          <ul>
            <li>
              <Link
                to="/dashboard?tab=profile"
                className={`flex items-center px-4 py-2 rounded-md transition duration-200 ${
                  isActive('profile') ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <FaUser className="mr-2" /> Profile
              </Link>
            </li>

            {isAdmin && (
              <>
                <li>
                  <Link
                    to="/dashboard?tab=overview"
                    className={`flex items-center px-4 py-2 rounded-md transition duration-200 ${
                      isActive('overview') ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                  >
                    <FaHome className="mr-2" /> Overview
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard?tab=posts"
                    className={`flex items-center px-4 py-2 rounded-md transition duration-200 ${
                      isActive('posts') ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                  >
                    <FaClipboardList className="mr-2" /> Posts
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard?tab=users"
                    className={`flex items-center px-4 py-2 rounded-md transition duration-200 ${
                      isActive('users') ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                  >
                    <FaUsers className="mr-2" /> Users
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard?tab=comments"
                    className={`flex items-center px-4 py-2 rounded-md transition duration-200 ${
                      isActive('comments') ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                  >
                    <FaComments className="mr-2" /> Comments
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard?tab=notifications"
                    className={`flex items-center px-4 py-2 rounded-md transition duration-200 ${
                      isActive('notifications') ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                  >
                    <FaBell className="mr-2" /> Notifications
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className="p-2 border-t border-gray-700 mt-auto">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-2 hover:bg-gray-700 rounded-md transition duration-200 text-left"
          >
            <FaSignOutAlt className="mr-2" /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default DashSidebar;
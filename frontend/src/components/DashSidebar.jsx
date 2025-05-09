import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaClipboardList, FaUsers, FaComments, FaHome ,FaBell} from 'react-icons/fa'; // Added FaHome for the overview icon
import { signoutSuccess } from '../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DashSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isActive = (tab) => location.search.includes(tab);

  const { currentUser } = useSelector((state) => state.user);
  const isAdmin = currentUser?.isAdmin || false; 

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

  return (
    <div className="w-64 h-screen bg-gray-800 text-white">
      {/* Dashboard Title */}
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
              onClick={handleSignOut}
            >
              <FaSignOutAlt className="mr-2" /> Sign Out
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default DashSidebar;

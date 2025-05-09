import { Link, useLocation } from "react-router-dom";
import { AiOutlineSearch } from "react-icons/ai";
import { useState, useEffect, useRef } from "react";
import { FaCloud } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { signoutSuccess } from "../redux/user/userSlice";
import { useNavigate } from 'react-router-dom';


export default function Header() {
  const location = useLocation();
  const { currentUser } = useSelector((state) => state.user);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Extract the search term from the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchterm'); // Corrected to lowercase
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/user/signout', {
        method: 'POST',
      });

      const data = await res.json();

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('searchterm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  return (
    <nav className="border-b bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2" >
              <FaCloud className="text-blue-600 text-2xl animate-spin-slow" />
              <span className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 transition duration-500 ease-in-out transform hover:scale-110">
                KubeCloud<span className="text-indigo-500">AI</span>
              </span>
            </Link>
          </div>

          <div className="hidden lg:block flex-grow max-w-md mx-auto relative">
            <form onSubmit={handleSubmit} className="flex items-center">
              <input
                type="text"
                placeholder="Search..."
                className="bg-gray-100 border border-gray-300 rounded-full py-2 pl-5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base w-full"
                value={searchTerm} // Bind input value to searchTerm
                onChange={(e) => setSearchTerm(e.target.value)} // Update searchTerm on change
              />
              <button type="submit" className="absolute right-3 top-2.5 text-gray-500 text-lg">
                <AiOutlineSearch />
              </button>
            </form>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex space-x-3">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
                  location.pathname === "/"
                    ? "text-white bg-indigo-600"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
                  location.pathname === "/about"
                    ? "text-white bg-indigo-600"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                About
              </Link>
              <Link
                to="/contact"
                className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
                  location.pathname === "/contact"
                    ? "text-white bg-indigo-600"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Contact
              </Link>
            </div>

            {currentUser ? (
              <div className="relative">
                <img
                  src={currentUser.profilePicture || "/default-avatar.png"}
                  alt="Profile"
                  className="w-10 h-10 rounded-full cursor-pointer"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                />
                {isProfileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl"
                  >
                    <div className="px-4 py-2 text-gray-800">
                      <p>{currentUser.displayName}</p>
                      <p className="text-sm text-gray-500">{currentUser.email}</p>
                    </div>
                    <div className="border-t border-gray-200"></div>
                    <Link
                      to="/dashboard?tab=profile"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/sign-in">
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-5 rounded-full hover:bg-gradient-to-l transition duration-300 text-base">
                  Sign In
                </button>
              </Link>
            )}

            <div className="lg:hidden">
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {isNavOpen ? (
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${
          isNavOpen ? "block" : "hidden"
        } lg:hidden bg-white border-t-2 mt-2 space-y-1 px-2 pt-2 pb-3`}
      >
        <Link
          to="/"
          className={`block px-4 py-3 rounded-md text-base font-medium transition-colors duration-300 ${
            location.pathname === "/"
              ? "text-white bg-indigo-600"
              : "text-gray-700 hover:bg-gray-200"
          }`}
        >
          Home
        </Link>
        <Link
          to="/about"
          className={`block px-4 py-3 rounded-md text-base font-medium transition-colors duration-300 ${
            location.pathname === "/about"
              ? "text-white bg-indigo-600"
              : "text-gray-700 hover:bg-gray-200"
          }`}
        >
          About
        </Link>
        <Link
          to="/contact"
          className={`block px-4 py-3 rounded-md text-base font-medium transition-colors duration-300 ${
            location.pathname === "/contact"
              ? "text-white bg-indigo-600"
              : "text-gray-700 hover:bg-gray-200"
          }`}
        >
          Contact
        </Link>
        <form onSubmit={handleSubmit} className="relative mt-3">
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-100 border border-gray-300 rounded-full py-2 pl-5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-base"
            value={searchTerm} // Bind input value to searchTerm
            onChange={(e) => setSearchTerm(e.target.value)} // Update searchTerm on change
          />
          <button type="submit" className="absolute right-4 top-2.5 text-gray-500 text-lg">
            <AiOutlineSearch />
          </button>
        </form>
        <Link to="/sign-in">
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-5 rounded-full hover:bg-gradient-to-l transition duration-300 w-full mt-3 text-base">
            Sign In
          </button>
        </Link>
      </div>
    </nav>
  );
}

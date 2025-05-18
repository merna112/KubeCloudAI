import { Link, useLocation, useNavigate } from "react-router-dom";
import { AiOutlineSearch } from "react-icons/ai";
import { useState, useEffect, useRef } from "react";
import { FaCloud } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { signoutSuccess } from "../redux/user/userSlice";

const placeholderSentences = [
  "Search for the latest technologies...",
  "Explore VMware articles...",
  "Everything about Azure & AWS...",
  "Dive into Kubernetes & AI..."
];

export default function Header() {
  const location = useLocation();
  const { currentUser } = useSelector((state) => state.user);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingFromFront, setIsDeletingFromFront] = useState(false);

  useEffect(() => {
    const currentSentence = placeholderSentences[sentenceIndex];
    let timeoutId;

    if (isDeletingFromFront) {
      if (animatedPlaceholder.length > 0) {
        timeoutId = setTimeout(() => {
          setAnimatedPlaceholder(prev => prev.substring(1));
        }, 100);
      } else {
        setIsDeletingFromFront(false);
        setIsDeleting(false);
        setSentenceIndex((prev) => (prev + 1) % placeholderSentences.length);
        setCharIndex(0);
      }
    } else if (isDeleting) {
      timeoutId = setTimeout(() => {
          setIsDeletingFromFront(true);
      }, 1500);
    } else {
      if (charIndex < currentSentence.length) {
        timeoutId = setTimeout(() => {
          setAnimatedPlaceholder(prev => prev + currentSentence.charAt(charIndex));
          setCharIndex(prev => prev + 1);
        }, 120);
      } else {
        timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    }
    return () => clearTimeout(timeoutId);
  }, [animatedPlaceholder, charIndex, isDeleting, isDeletingFromFront, sentenceIndex]);


  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    } else {
      setSearchTerm('');
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
    const currentParams = new URLSearchParams(location.search);
    const newParams = new URLSearchParams();

    if (searchTerm.trim()) {
      newParams.set('searchTerm', searchTerm);
    } else {
      newParams.delete('searchTerm');
    }

    const sortParam = currentParams.get('sort') || 'desc';
    newParams.set('sort', sortParam);

    const categoryParam = currentParams.get('category');
    if (categoryParam && categoryParam !== 'uncategorized') {
        newParams.set('category', categoryParam);
    }
    
    navigate(`/search?${newParams.toString()}`);
    if (isNavOpen) setIsNavOpen(false);
  };

  return (
    <nav className="border-b bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2" >
              <FaCloud className="text-blue-600 dark:text-blue-400 text-2xl animate-spin-slow" />
              <span className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 transition duration-500 ease-in-out transform hover:scale-110 dark:from-blue-400 dark:to-purple-500 dark:hover:from-purple-500 dark:hover:to-blue-400">
                KubeCloud<span className="text-indigo-500 dark:text-indigo-400">AI</span>
              </span>
            </Link>
          </div>

          <div className="hidden lg:block flex-grow max-w-md mx-auto relative">
            <form onSubmit={handleSubmit} className="flex items-center">
              <input
                type="text"
                placeholder={animatedPlaceholder}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full py-2 pl-5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-base w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">
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
                    ? "text-white bg-indigo-600 dark:bg-indigo-500"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
                  location.pathname === "/about"
                    ? "text-white bg-indigo-600 dark:bg-indigo-500"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                About
              </Link>
              <Link
                to="/contact"
                className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
                  location.pathname === "/contact"
                    ? "text-white bg-indigo-600 dark:bg-indigo-500"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
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
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                />
                {isProfileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-50"
                  >
                    <div className="px-4 py-2 text-gray-800 dark:text-gray-200">
                      <p className="font-semibold">{currentUser.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600"></div>
                    <Link
                      to="/dashboard?tab=profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Profile
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-600"></div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsProfileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/sign-in">
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-5 rounded-full hover:bg-gradient-to-l transition duration-300 text-base dark:from-blue-400 dark:to-purple-500">
                  Sign In
                </button>
              </Link>
            )}

            <div className="lg:hidden">
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:text-gray-700 dark:focus:text-gray-200"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {isNavOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
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
        } lg:hidden bg-white dark:bg-gray-800 border-t-2 dark:border-gray-700 mt-0 space-y-1 px-2 pt-2 pb-3 shadow-lg`}
      >
        <Link
          to="/"
          onClick={() => setIsNavOpen(false)}
          className={`block px-4 py-3 rounded-md text-base font-medium transition-colors duration-300 ${
            location.pathname === "/"
              ? "text-white bg-indigo-600 dark:bg-indigo-500"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          Home
        </Link>
        <Link
          to="/about"
          onClick={() => setIsNavOpen(false)}
          className={`block px-4 py-3 rounded-md text-base font-medium transition-colors duration-300 ${
            location.pathname === "/about"
              ? "text-white bg-indigo-600 dark:bg-indigo-500"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          About
        </Link>
        <Link
          to="/contact"
          onClick={() => setIsNavOpen(false)}
          className={`block px-4 py-3 rounded-md text-base font-medium transition-colors duration-300 ${
            location.pathname === "/contact"
              ? "text-white bg-indigo-600 dark:bg-indigo-500"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          Contact
        </Link>
        <form onSubmit={handleSubmit} className="relative mt-3">
          <input
            type="text"
            placeholder={animatedPlaceholder}
            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full py-2 pl-5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 w-full text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">
            <AiOutlineSearch />
          </button>
        </form>
        {!currentUser && (
          <Link to="/sign-in" onClick={() => setIsNavOpen(false)}>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-5 rounded-full hover:bg-gradient-to-l transition duration-300 w-full mt-3 text-base dark:from-blue-400 dark:to-purple-500">
              Sign In
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}
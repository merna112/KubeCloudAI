import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';

const POSTS_PER_PAGE = 9;

const INITIAL_SIDEBAR_DATA = {
  searchTerm: '',
  sort: 'desc',
  category: 'uncategorized',
};

export default function Search() {
  const [sidebarData, setSidebarData] = useState(INITIAL_SIDEBAR_DATA);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    const sortFromUrl = urlParams.get('sort');
    const categoryFromUrl = urlParams.get('category');

    setSidebarData({
      searchTerm: searchTermFromUrl || INITIAL_SIDEBAR_DATA.searchTerm,
      sort: sortFromUrl || INITIAL_SIDEBAR_DATA.sort,
      category: categoryFromUrl || INITIAL_SIDEBAR_DATA.category,
    });

    const fetchPostsData = async () => {
      setLoading(true);
      setFetchError(null);
      setPosts([]); 
      const searchQuery = urlParams.toString();
      try {
        const res = await fetch(`/api/post/getposts?${searchQuery}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Failed to fetch posts. Server responded with an error.' }));
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setPosts(data.posts || []);
        setShowMore((data.posts || []).length === POSTS_PER_PAGE);
      } catch (error) {
        setFetchError(error.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPostsData();
  }, [location.search]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSidebarData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    if (sidebarData.searchTerm) {
      urlParams.set('searchTerm', sidebarData.searchTerm);
    }
    urlParams.set('sort', sidebarData.sort);
    if (sidebarData.category && sidebarData.category !== 'uncategorized') {
      urlParams.set('category', sidebarData.category);
    } else if (sidebarData.category === 'uncategorized' && INITIAL_SIDEBAR_DATA.category !== 'uncategorized') {
       urlParams.set('category', 'uncategorized');
    }
    navigate(`/search?${urlParams.toString()}`);
  };

  const handleShowMore = async () => {
    const numberOfPosts = posts.length;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', numberOfPosts);
    const searchQuery = urlParams.toString();
    setLoading(true);
    try {
      const res = await fetch(`/api/post/getposts?${searchQuery}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch more posts.'}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setPosts((prev) => [...prev, ...(data.posts || [])]);
      setShowMore((data.posts || []).length === POSTS_PER_PAGE);
    } catch (error) {
      setFetchError(error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className='flex flex-col lg:flex-row min-h-screen bg-gray-100 dark:bg-gray-900'>
      <div className='lg:w-1/3 p-6 sm:p-8 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 shadow-md lg:sticky lg:top-0 lg:self-start lg:h-screen lg:overflow-y-auto'>
        <h2 className='text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200'>Filters</h2>
        <form className='space-y-6' onSubmit={handleSubmit}>
          <div>
            <label htmlFor='searchTerm' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Search Term</label>
            <input
              type='text'
              id='searchTerm'
              placeholder='Search...'
              className='mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm placeholder-gray-500 dark:placeholder-gray-400'
              value={sidebarData.searchTerm}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor='sort' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Sort By</label>
            <select
              id='sort'
              className='mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm'
              value={sidebarData.sort}
              onChange={handleChange}
            >
              <option value='desc'>Latest</option>
              <option value='asc'>Oldest</option>
            </select>
          </div>
          <div>
            <label htmlFor='category' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Category</label>
            <select
              id='category'
              className='mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm'
              value={sidebarData.category}
              onChange={handleChange}
            >
              <option value='uncategorized'>All Categories</option>
              <option value='AI'>AI</option>
              <option value='Cloud'>Cloud Computing</option>
              <option value='Virtualization'>Virtualization</option>
              <option value='Kubernetes'>Kubernetes</option>
              <option value='DevOps'>DevOps</option>
              <option value='Security'>Security</option>
            </select>
          </div>
          <button
            type='submit'
            className='w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-offset-gray-800'
            disabled={loading}
          >
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>
        </form>
      </div>
      <div className='flex-grow p-6 sm:p-8'>
        <h1 className='text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-200'>Search Results</h1>
        {fetchError && (
            <div className='mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg'>
                <p className='font-semibold'>Error:</p>
                <p>{fetchError}</p>
            </div>
        )}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
          {loading && posts.length === 0 && (
            Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow animate-pulse bg-white dark:bg-gray-800">
                    <div className="h-40 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mt-3"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mt-1"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mt-1"></div>
                </div>
            ))
          )}
          {!loading && posts.length === 0 && !fetchError && <p className='col-span-full text-xl text-gray-500 dark:text-gray-400 text-center py-10'>No posts found matching your criteria.</p>}
          {posts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>
        {showMore && !loading && (
          <div className='text-center mt-8'>
            <button
              onClick={handleShowMore}
              className='px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-offset-gray-900'
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';

export default function Search() {
  const [sidebarData, setSidebarData] = useState({
    searchTerm: '',
    sort: 'desc',
    category: 'uncategorized',
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    const sortFromUrl = urlParams.get('sort');
    const categoryFromUrl = urlParams.get('category');
    
    setSidebarData((prevData) => ({
      ...prevData,
      searchTerm: searchTermFromUrl || prevData.searchTerm,
      sort: sortFromUrl || prevData.sort,
      category: categoryFromUrl || prevData.category,
    }));
  
    const fetchPosts = async () => {
      setLoading(true);
      const searchQuery = urlParams.toString();
      const res = await fetch(`/api/post/getposts?${searchQuery}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPosts(data.posts);
      setLoading(false);
      setShowMore(data.posts.length === 9);
    };
  
    fetchPosts();
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
    Object.keys(sidebarData).forEach((key) => {
      if (sidebarData[key]) {
        urlParams.set(key, sidebarData[key]);
      }
    });
    navigate(`/search?${urlParams.toString()}`);
  };

  const handleShowMore = async () => {
    const numberOfPosts = posts.length;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', numberOfPosts);
    const searchQuery = urlParams.toString();
    const res = await fetch(`/api/post/getposts?${searchQuery}`);
    if (!res.ok) {
      return;
    }
    const data = await res.json();
    setPosts((prev) => [...prev, ...data.posts]);
    setShowMore(data.posts.length === 9);
  };

  return (
    <div className='flex flex-col lg:flex-row min-h-screen bg-gray-100'>
      <div className='lg:w-1/3 p-8 bg-white border-r border-gray-300 shadow-md'>
        <h2 className='text-2xl font-bold mb-6'>Filters</h2>
        <form className='space-y-6' onSubmit={handleSubmit}>
          <div>
            <label htmlFor='searchTerm' className='block text-sm font-medium text-gray-700'>Search Term</label>
            <input
              type='text'
              id='searchTerm'
              placeholder='Search...'
              className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              value={sidebarData.searchTerm}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor='sort' className='block text-sm font-medium text-gray-700'>Sort By</label>
            <select
              id='sort'
              className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              value={sidebarData.sort}
              onChange={handleChange}
            >
              <option value='desc'>Latest</option>
              <option value='asc'>Oldest</option>
            </select>
          </div>
          <div>
            <label htmlFor='category' className='block text-sm font-medium text-gray-700'>Category</label>
            <select
              id='category'
              className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              value={sidebarData.category}
              onChange={handleChange}
            >
              <option value='uncategorized'>Uncategorized</option>
              <option value='AI'>AI</option>
              <option value='Cloud'>Cloud</option>
              <option value='Virtualization'>Virtualization</option>
            </select>
          </div>
          <button
            type='submit'
            className='w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
          >
            Apply Filters
          </button>
        </form>
      </div>
      <div className='lg:w-2/3 p-8'>
        <h1 className='text-3xl font-semibold mb-6'>Search Results</h1>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {loading && <p className='text-xl text-gray-500'>Loading...</p>}
          {!loading && posts.length === 0 && <p className='text-xl text-gray-500'>No posts found.</p>}
          {!loading && posts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>
        {showMore && (
          <div className='text-center mt-8'>
            <button
              onClick={handleShowMore}
              className='px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500'
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import CallToAction from '../components/CallToAction';
import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard';
import Chatbot from '../components/Chatbot';

const Spinner = () => (
  <div className="flex justify-center items-center h-full w-full">
    <svg className="animate-spin h-12 w-12 text-teal-500 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);

const placeholderSentences = [
  "Search for the latest technologies...",
  "Explore VMware articles...",
  "Everything about Azure & AWS...",
  "Dive into Kubernetes & AI..."
];

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/post/getPosts');
        if (!res.ok) {
          throw new Error(`Failed to fetch posts, status: ${res.status}`);
        }
        const data = await res.json();
        let fetchedPosts = data.posts || [];

        fetchedPosts.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA;
        });

        setPosts(fetchedPosts);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError(err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const recentPosts = Array.isArray(posts) ? posts.slice(0, 4) : [];

  return (
    <div className='bg-gray-100 dark:bg-gray-900 min-h-screen'>
      <header className='bg-gradient-to-r from-blue-500 to-teal-400 text-white py-12 sm:py-16 md:py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold'>
            Welcome to KubeCloudAI
          </h1>
          <p className='mt-4 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto'>
            Explore cutting-edge content on cloud technologies including VMware virtualization, Azure, AWS, Kubernetes, and AI.
          </p>
          
          <div className='mt-8 max-w-xl mx-auto'>
            <div className="relative flex items-center">
              <input
                type="search"
                placeholder={animatedPlaceholder}
                className="w-full py-3 px-4 pr-10 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 placeholder-gray-500 dark:placeholder-gray-400"
                readOnly
                onClick={() => {
                  const searchInput = document.getElementById('actual-search-input');
                  if (searchInput) searchInput.focus();
                }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 dark:text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </div>
            <input type="text" id="actual-search-input" className="opacity-0 w-0 h-0 absolute" />
          </div>

          <Link
            to='/search'
            className='mt-8 inline-block bg-teal-500 text-white py-2 px-4 rounded-lg font-bold text-xs sm:text-sm md:text-base hover:bg-teal-600 transition-colors duration-200'
          >
            View All Posts
          </Link>
        </div>
      </header>

      <section className='bg-white dark:bg-gray-800 py-12 sm:py-16'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl'>
          <CallToAction />
        </div>
      </section>

      <section className='py-16 sm:py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl'>
          <h2 className='text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-800 dark:text-gray-200'>
            Latest Insights
          </h2>
          {loading ? (
            <div className="py-16">
              <Spinner />
            </div>
          ) : error ? (
            <div className='text-center text-red-500 dark:text-red-400 py-16 text-lg'>
              Error loading posts: {error}. Please try again later.
            </div>
          ) : recentPosts.length > 0 ? (
            <>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8'>
                {recentPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
              {posts.length > 4 && (
                <div className='text-center mt-12'>
                  <Link
                    to='/search'
                    className='text-lg font-semibold text-teal-500 dark:text-teal-400 hover:underline group'
                  >
                    View all posts <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">→</span>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className='text-center text-gray-500 dark:text-gray-400 py-16 text-lg'>
              No recent posts available yet. Stay tuned!
            </div>
          )}
        </div>
      </section>
      <Chatbot />
    </div>
  );
}
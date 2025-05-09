// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import CallToAction from '../components/CallToAction';
import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard';
import Chatbot from '../components/Chatbot';

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/post/getPosts');
        if (!res.ok) {
          console.error('Failed to fetch posts, status:', res.status);
          return;
        }
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setPosts([]);
      }
    };
    fetchPosts();
  }, []);

  const recentPosts = Array.isArray(posts) ? posts.slice(0, 8) : [];

  return (
    <div className='bg-gray-100 dark:bg-gray-900 min-h-screen'>
      {/* --- Header --- */}
      <header className='bg-gradient-to-r from-blue-500 to-teal-400 text-white py-12'>
        <div className='flex flex-col items-center max-w-6xl mx-auto px-4 text-center'>
          <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold'>
            Welcome to KubeCloudAI
          </h1>
          <p className='mt-4 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto'>
            Explore cutting-edge content on cloud technologies including VMware virtualization, Azure, AWS, Kubernetes, and AI.
          </p>
          <Link
            to='/search'
            className='mt-6 inline-block bg-teal-500 text-white py-2 px-4 rounded-lg font-bold text-xs sm:text-sm md:text-base hover:bg-teal-600 transition-colors duration-200'
          >
            View All Posts
          </Link>
        </div>
      </header>

      {/* --- Call to Action --- */}
      <section className='bg-white dark:bg-gray-800 py-16'>
        <div className='max-w-4xl mx-auto px-4'>
          <CallToAction />
        </div>
      </section>

      {/* --- Recent Posts --- */}
      <section className='max-w-7xl mx-auto px-4 py-16'>
        {recentPosts.length > 0 ? (
          <>
            <h2 className='text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-800 dark:text-gray-200'>
              Latest Insights
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
              {recentPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
            <div className='text-center mt-12'>
              <Link
                to='/search'
                className='text-lg font-semibold text-teal-500 dark:text-teal-400 hover:underline'
              >
                View all posts →
              </Link>
            </div>
          </>
        ) : (
          <div className='text-center text-gray-500 dark:text-gray-400 py-16'>
            Loading posts or no posts available yet. Check back soon!
          </div>
        )}
      </section>
      <Chatbot />
    </div>
  );
}
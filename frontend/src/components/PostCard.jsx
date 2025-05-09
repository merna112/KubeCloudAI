import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

function PostCard({ post }) {
  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-lg border border-gray-200 shadow-xl bg-white group">
      {/* Image Section */}
      <Link to={`/post/${post.slug}`}>
        <div className="relative group">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-48 object-cover transition-transform duration-500 ease-in-out transform group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-300 ease-in-out"></div>
        </div>
      </Link>
      
      {/* Content Section */}
      <div className="p-6 flex flex-col h-64">
        <p className="text-2xl font-bold text-gray-800 mb-3 truncate">{post.title}</p>
        <span className="text-sm text-teal-600 mb-4">{post.category}</span>
        <p className="text-gray-700 flex-1 line-clamp-4">{post.excerpt}</p>
        
        {/* Read More Button */}
        <Link
          to={`/post/${post.slug}`}
          className="mt-auto inline-block py-3 px-6 bg-teal-600 text-white text-center font-semibold rounded-lg shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105"
        >
          Read Article
        </Link>
      </div>
    </div>
  );
}

// Define the propTypes for the PostCard component
PostCard.propTypes = {
  post: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
  }).isRequired,
};

export default PostCard;

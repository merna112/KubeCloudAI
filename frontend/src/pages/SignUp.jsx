import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import OAuth from '../components/OAuth';

const carouselData = [
  {
    title: 'Welcome to KubeCloudAI',
    description: 'Discover cutting-edge cloud technologies and stay ahead in the tech world.',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Latest Articles',
    description: 'Read our latest blog posts and stay updated with trends.',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Join Our Community',
    description: 'Connect with tech enthusiasts and share your knowledge.',
    bgColor: 'bg-green-100',
  },
];

const SignUp = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            setErrorMessage('');
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include', // Ensures cookies are sent with the request
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage(data.message);
            } else {
                setMessage('An error occurred. Please try again.');
                setErrorMessage(data.message || 'An error occurred.');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
            {/* Carousel Section */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-4 lg:p-8 bg-gray-50 relative">
                <Swiper
                    spaceBetween={0}
                    centeredSlides={true}
                    autoplay={{
                        delay: 2000, 
                        disableOnInteraction: false,
                    }}
                    loop={true}
                    pagination={false} 
                    navigation={false} 
                    className="w-full h-full"
                >
                    {carouselData.map((item, index) => (
                        <SwiperSlide key={index} className={`flex items-center justify-center ${item.bgColor} p-8`}>
                            <motion.div
                                className="text-center p-8 rounded-lg shadow-lg"
                                initial={{ opacity: 0, y: -30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <h2 className="text-4xl font-bold text-purple-700 mb-4">{item.title}</h2>
                                <p className="text-xl text-gray-700">{item.description}</p>
                            </motion.div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Signup Form Section */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-4 lg:p-8 bg-white">
                <motion.div
                    className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-6 border border-gray-200"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    whileHover={{
                        scale: 1.1, 
                        transition: { duration: 0.3, ease: 'easeOut' }, 
                    }}
                >
                    <h2 className="text-3xl font-extrabold text-center text-purple-600 mb-8">
                        Join Our Community
                    </h2>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <motion.input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <motion.input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <motion.input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <motion.input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-purple-500 text-white font-semibold rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-transform transform hover:scale-105"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Your Account'}
                        </button>
                        <OAuth />
                    </form>
                    {message && <p className={`text-sm text-center ${message.includes('error') ? 'text-red-600' : 'text-green-600'} mt-4`}>{message}</p>}
                    <div className='flex gap-2 text-sm mt-5'>
                        <span>Have an Account?</span>
                        <Link to='/sign-in' className='text-blue-800'>Sign In</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SignUp;

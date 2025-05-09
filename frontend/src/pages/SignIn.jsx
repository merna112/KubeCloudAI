import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice';
import OAuth from '../components/OAuth';

const SignIn = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { loading, error: errorMessage } = useSelector(state => state.user);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            return dispatch(signInFailure('Please fill out all fields'));
        }

        dispatch(signInStart());

        try {
            const res = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include', 
            });

            if (!res.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await res.json();

            if (data.success === false) {
                dispatch(signInFailure(data.message));
            } else {
                dispatch(signInSuccess(data));
                console.log('Successfully signed in'); 
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error.message || 'An error occurred. Please try again.'); // Added logging
            dispatch(signInFailure(error.message || 'An error occurred. Please try again.'));
        }
    };
    // Debugging state
    useEffect(() => {
        console.log('Loading state:', loading);
    }, [loading]);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
            <div className="w-full lg:w-[55%] flex items-center justify-center p-4 lg:p-8 bg-gray-50 relative">
                <div className="text-center p-8 rounded-lg shadow-lg bg-white">
                    <h2 className="text-4xl font-bold text-purple-700 mb-4">Welcome Back</h2>
                    <p className="text-xl text-gray-700">Log in to continue your journey with KubeCloudAI.</p>
                </div>
            </div>
            <div className="w-full lg:w-[45%] flex items-center justify-center p-4 lg:p-8 bg-white">
                <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-6 border border-gray-200">
                    <h2 className="text-3xl font-extrabold text-center text-purple-600 mb-8">
                        Login to Your Account
                    </h2>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="example@gmail.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="**********"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-purple-500 text-white font-semibold rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-transform transform hover:scale-105"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>
                    <OAuth />
                    <div className="flex gap-2 text-sm mt-5">
                        <span>Don&apos;t have an account?</span>
                        <Link to="/sign-up" className="text-blue-800">Sign Up</Link>
                    </div>
                    {errorMessage && <p className="text-sm text-center mt-4 text-red-600">{errorMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default SignIn;

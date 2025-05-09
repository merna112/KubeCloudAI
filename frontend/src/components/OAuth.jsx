import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import app from '../firebase';
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../redux/user/userSlice';
import { useNavigate } from 'react-router-dom';

export default function OAuth() {
    const auth = getAuth(app);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleClickToGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            const resultFromGoogle = await signInWithPopup(auth, provider);
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: resultFromGoogle.user.displayName,
                    email: resultFromGoogle.user.email,
                    googlePhotoUrl: resultFromGoogle.user.photoURL,
                }),
                credentials: 'include',
            });

            const data = await res.json();

            if (res.ok) {
                dispatch(signInSuccess(data));
                console.log('Authentication successful'); 
                navigate('/'); 
            } else {
                console.error(data.message || 'Google sign-in failed');
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
        }
    };

    return (
        <button
            type="button"
            className="w-full max-w-md py-3 px-6 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-transform transform hover:scale-105 text-base"
            onClick={handleClickToGoogle}
        >
            Continue with Google
        </button>
    );
}

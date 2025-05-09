import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { updateStart, updateSuccess, updateFailure, deleteUserStart, deleteUserSuccess, deleteUserFailure, signoutSuccess } from '../redux/user/userSlice';
import app from '../firebase';
import { useNavigate } from 'react-router-dom';



export default function DashProfile() {
  const navigate = useNavigate();
  const { currentUser, loading } = useSelector((state) => state.user);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileUrl, setImageFileUrl] = useState(currentUser?.profilePicture);
  const [uploading, setUploading] = useState(false);
  const filePickerRef = useRef();
  const [imageFileUploadProgress, setImageFileUploadProgress] = useState(0);
  const [imageFileUploadError, setImageFileUploadError] = useState(null);
  const [updateUserSuccess, setUpdateUserSuccess] = useState(null);
  const [updateUserError, setUpdateUserError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    if (currentUser) {
      setImageFileUrl(currentUser.profilePicture);
    }
  }, [currentUser]);

  const handleCreatePost = () => {
    navigate('/create-post');
  };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      try {
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
        setUploading(true);
        setImageFileUploadProgress(0);
        setImageFileUploadError(null);

        const storage = getStorage(app);
        const storageRef = ref(storage, `profilePictures/${currentUser._id}`);
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setImageFileUploadProgress(progress);
          },
          (error) => {
            setImageFileUploadError('Failed to upload image');
            setUploading(false);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              setImageFileUrl(downloadURL);
              setUploading(false);
              setFormData((prev) => ({ ...prev, profilePicture: downloadURL }));
            });
          }
        );
      } catch (error) {
        setImageFileUploadError('Failed to compress image');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateUserError(null);
    setUpdateUserSuccess(null);

    if (Object.keys(formData).length === 0 && !imageFile) {
      setUpdateUserError('No changes made');
      return;
    }

    if (uploading) {
      setUpdateUserError('Please wait for image to upload');
      return;
    }

    const requestBody = {
      ...formData,
      profilePicture: imageFileUrl || currentUser?.profilePicture,
    };

    try {
      dispatch(updateStart());

      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        dispatch(updateFailure(data.message));
        setUpdateUserError(data.message);
      } else {
        dispatch(updateSuccess(data));
        setUpdateUserSuccess("User's profile updated successfully");
      }
    } catch (error) {
      dispatch(updateFailure(error.message));
      setUpdateUserError(error.message);
    }
  };

  const handleDeleteUser = async () => {
    setShowModal(false);
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(deleteUserFailure(data.message));
      } else {
        dispatch(deleteUserSuccess(data));
        navigate('/sign-in'); // Redirect after successful deletion
      }
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/user/signout', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
        navigate('/sign-in');
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Your Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              ref={filePickerRef}
              className="hidden"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CircularProgressbar
                  value={imageFileUploadProgress}
                  text={`${Math.round(imageFileUploadProgress)}%`}
                  strokeWidth={5}
                  styles={{
                    root: { width: '100%', height: '100%' },
                    path: { stroke: '#4a90e2' },
                    text: { fill: '#4a90e2', fontSize: '1.5rem' },
                  }}
                />
              </div>
            )}
            <img
              src={imageFileUrl}
              alt="User Profile Pic"
              className={`w-32 h-32 rounded-full object-cover border-4 border-indigo-500 cursor-pointer ${uploading ? 'opacity-50' : 'opacity-100'}`}
              onClick={() => filePickerRef.current.click()}
            />
          </div>

          <div className="text-center">
            <span
              className={`inline-block px-3 py-1 rounded-full text-white text-sm ${currentUser?.isAdmin ? 'bg-red-500' : 'bg-green-500'}`}
            >
              {currentUser?.isAdmin ? 'Admin' : 'User'}
            </span>
          </div>

          {imageFileUploadError && (
            <div className="text-red-600 text-center mt-4">{imageFileUploadError}</div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Username"
              defaultValue={currentUser?.username}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Email"
              defaultValue={currentUser?.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="New Password"
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>

          {updateUserError && (
            <div className="text-red-600 text-center mt-4">{updateUserError}</div>
          )}
          {updateUserSuccess && (
            <div className="text-green-600 text-center mt-4">{updateUserSuccess}</div>
          )}
        </form>

       {currentUser.isAdmin&& <div className="mt-8">
          <button
            onClick={handleCreatePost}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
          >
            Create New Post
          </button>
        </div>}

        <div className="mt-4">
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Are you sure you want to delete your account?
              </h3>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteUser}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-900 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={handleSignOut}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}


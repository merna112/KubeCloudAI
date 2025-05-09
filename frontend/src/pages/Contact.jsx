import { useState } from 'react';
import { useSelector } from 'react-redux';

export default function Contact() {
  const { currentUser } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null); // `null` to distinguish from `true` and `false`

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'contact', 
        message: formData.message,
        userId: currentUser?._id, 
      }),
    });

    if (response.ok) {
      setSubmitSuccess(true);
      setFormData({ message: '' });
    } else {
      const errorData = await response.json(); 
      throw new Error(errorData.message || 'Failed to submit message');
    }
  } catch (error) {
    console.error('Failed to submit message:', error);
    setSubmitSuccess(false);
  } finally {
    setIsSubmitting(false);
  }
};
  
  return (
    <div className='bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center p-6'>
      <div className='w-full max-w-3xl bg-white dark:bg-gray-800 shadow-2xl rounded-lg overflow-hidden'>
        <div className='relative'>
          <img
            src='https://th.bing.com/th/id/OIP.K8c3c6MvSfiuI8H935hxrwHaEK?w=750&h=422&rs=1&pid=ImgDetMain'
            alt='Contact Us'
            className='w-full h-64 object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black opacity-50'></div>
        </div>
        <div className='relative p-8'>
          <h1 className='text-4xl sm:text-5xl font-bold text-teal-600 dark:text-teal-400 mb-4 text-center'>
            We’d Love to Hear from You!
          </h1>
          <p className='text-lg text-gray-600 dark:text-gray-300 mb-8 text-center'>
            If you have any questions, feedback, or just want to say hello, feel free to reach out to us!
          </p>
          <form onSubmit={handleSubmit} className='space-y-8'>
            <div>
              <label htmlFor='message' className='block text-gray-700 dark:text-gray-300 text-base font-medium mb-2'>
                Message
              </label>
              <textarea
                id='message'
                name='message'
                rows='6'
                value={formData.message}
                onChange={handleChange}
                required
                className='block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 transition duration-300 ease-in-out'
              ></textarea>
            </div>
            <div>
              <button
                type='submit'
                disabled={isSubmitting}
                className='w-full py-3 px-4 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-300 ease-in-out disabled:opacity-50'
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
          {submitSuccess !== null && (
            <div className={`mt-4 text-center ${submitSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {submitSuccess ? 'Message sent successfully!' : 'Failed to send message. Please try again.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

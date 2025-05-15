import { useState, useEffect } from 'react';

export default function About() {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = [
    "About KubeCloudAI",
    "Discover Cutting-Edge Technologies",
    "Explore VMware, Azure, AWS, Kubernetes, and AI"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className='bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col'>
      <header className='relative bg-gradient-to-r from-teal-500 to-teal-600 text-white py-10 sm:py-12 md:py-16 overflow-hidden'>
        <div className='absolute inset-0 flex items-center justify-center px-4 sm:px-6'>
          <div className='w-full'>
            <div
              className='flex flex-nowrap transition-transform duration-1000 ease-in-out'
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
            >
              {slides.map((text, index) => (
                <div key={index} className='flex-shrink-0 w-full text-center flex items-center justify-center'>
                  <h1 className='w-full text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold break-words leading-tight 
                                 sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto'>
                    {text}
                  </h1>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className='flex-grow'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12'>
          <div className='bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden'>
            <div className='relative'>
              <img
                src='https://img.freepik.com/premium-photo/laptop-cloud-with-screen-that-says-cloud-computing-it_220363-1270.jpg'
                alt='Cloud Technologies'
                className='w-full h-48 sm:h-56 md:h-64 object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black opacity-50'></div>
            </div>
            <div className='relative p-4 sm:p-6 md:p-8'>
              <h2 className='text-xl sm:text-2xl md:text-3xl font-semibold text-teal-600 dark:text-teal-400'>
                Welcome to KubeCloudAI
              </h2>
              <p className='mt-4 text-gray-700 dark:text-gray-300 text-base sm:text-lg'>
                KubeCloudAI is your premier destination for expert insights and tutorials on the latest in cloud technologies. Our blog explores critical topics such as VMware virtualization, Azure, AWS, Kubernetes, and AI, providing you with the knowledge and tools to excel in today is fast-paced tech landscape.
              </p>
              <p className='mt-4 text-gray-700 dark:text-gray-300 text-base sm:text-lg'>
                Whether you are a seasoned IT professional or a curious tech enthusiast, KubeCloudAI offers valuable content designed to keep you ahead of the curve. Dive into our detailed guides and articles to stay informed and inspired.
              </p>
              <p className='mt-4 text-gray-700 dark:text-gray-300 text-base sm:text-lg'>
                Join us on a journey through the world of cloud computing and technology innovation. Explore, learn, and grow with us as we navigate the future of cloud solutions together.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
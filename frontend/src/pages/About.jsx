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
  }, []);

  return (
    <div className='bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col'>
      <header className='relative bg-gradient-to-r from-teal-500 to-teal-600 text-white py-16 overflow-hidden'>
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='flex flex-nowrap transition-transform duration-1000' style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
            {slides.map((text, index) => (
              <div key={index} className='flex-shrink-0 w-full text-center'>
                <h1 className='text-4xl sm:text-5xl md:text-6xl font-extrabold'>{text}</h1>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className='flex-grow'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <div className='bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden'>
            <div className='relative'>
              <img
                src='https://img.freepik.com/premium-photo/laptop-cloud-with-screen-that-says-cloud-computing-it_220363-1270.jpg'
                alt='Cloud Technologies'
                className='w-full h-64 object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black opacity-50'></div>
            </div>
            <div className='relative p-8'>
              <h2 className='text-2xl sm:text-3xl font-semibold text-teal-600 dark:text-teal-400'>
                Welcome to KubeCloudAI
              </h2>
              <p className='mt-4 text-gray-700 dark:text-gray-300 text-lg sm:text-xl'>
                KubeCloudAI is your premier destination for expert insights and tutorials on the latest in cloud technologies. Our blog explores critical topics such as VMware virtualization, Azure, AWS, Kubernetes, and AI, providing you with the knowledge and tools to excel in today is fast-paced tech landscape.
              </p>
              <p className='mt-4 text-gray-700 dark:text-gray-300 text-lg sm:text-xl'>
                Whether you are a seasoned IT professional or a curious tech enthusiast, KubeCloudAI offers valuable content designed to keep you ahead of the curve. Dive into our detailed guides and articles to stay informed and inspired.
              </p>
              <p className='mt-4 text-gray-700 dark:text-gray-300 text-lg sm:text-xl'>
                Join us on a journey through the world of cloud computing and technology innovation. Explore, learn, and grow with us as we navigate the future of cloud solutions together.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className='bg-gray-100 dark:bg-gray-800 py-6'>
        <div className='max-w-6xl mx-auto px-6 text-center text-gray-600 dark:text-gray-400'>
        </div>
      </footer>
    </div>
  );
}

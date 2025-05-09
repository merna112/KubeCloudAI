export default function CallToAction() {
    return (
      <div className="flex flex-col sm:flex-row p-6 border border-teal-500 rounded-lg shadow-lg bg-white max-w-5xl mx-auto my-8">
        {/* Text and Button Section */}
        <div className="flex-1 flex flex-col justify-center p-6">
          <h2 className="text-3xl font-bold text-teal-700 mb-2">
            Unleash the Power of AI for Your Business!
          </h2>
          <p className="text-gray-600 mb-4">
            Are you ready to transform your business with the cutting-edge capabilities of Artificial Intelligence? 
            Dive into the world of AI and unlock new opportunities for innovation and growth. Explore the latest trends, 
            gain valuable insights, and discover actionable applications that can revolutionize your business strategies.
          </p>
          <a
            href="https://www.exampleairesources.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
          >
            Explore AI Resources
          </a>
        </div>
        
        {/* Image Section */}
        <div className="flex-1 flex justify-center items-center p-6">
          <img
            src="https://www.mouritech.com/wp-content/uploads/2023/05/Unlocking-the-Full-Potential-of-AI-in-Your-Business-1-768x394.jpg"
            alt="AI and Business"
            className="max-w-full h-auto rounded-lg shadow-md"
          />
        </div>
      </div>
    );
  }

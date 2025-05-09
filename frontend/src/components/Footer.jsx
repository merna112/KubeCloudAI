import { Link } from 'react-router-dom';
import { Footer } from 'flowbite-react';
import { FaCloud } from "react-icons/fa";
import { BsFacebook, BsInstagram, BsTwitter, BsGithub, BsDribbble } from 'react-icons/bs';

export default function FooterCom() {
  return (
    <Footer 
      container 
      className='border border-t-4 border-purple-500 bg-gray-800' 
    >
      <div className='w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        <div className='grid w-full justify-between sm:flex sm:justify-between md:flex md:grid-cols-1 gap-8'>
          <div className='mb-8 sm:mb-0 max-w-sm'>
            <Link
              to='/'
              className='self-center whitespace-nowrap text-lg sm:text-xl font-semibold text-white flex items-center' 
            >
              <FaCloud className="text-blue-400 text-2xl sm:text-3xl mr-2" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"> 
                KubeCloud<span className="text-indigo-400">AI</span>
              </span>
            </Link>
            <p className='mt-4 text-sm text-gray-400'>
              Your go-to source for the latest in cloud technologies, AI insights, and web development. Stay updated, stay ahead.
            </p>
          </div>
          <div className='grid grid-cols-2 gap-8 sm:mt-4 sm:grid-cols-3 sm:gap-6'>
            <div>
              <Footer.Title title='About' className='text-white' /> 
              <Footer.LinkGroup col>
                <Footer.Link as={Link} to='/about' className='text-gray-400 hover:text-white'> 
                  KubeCloudAI
                </Footer.Link>
                <Footer.Link as={Link} to='/blog' className='text-gray-400 hover:text-white'>
                  Blog
                </Footer.Link>
                <Footer.Link as={Link} to='/contact' className='text-gray-400 hover:text-white'>
                  Contact
                </Footer.Link>
              </Footer.LinkGroup>
            </div>
            <div>
              <Footer.Title title='Follow us' className='text-white' />
              <Footer.LinkGroup col>
                <Footer.Link href='https://github.com/yourusername' target='_blank' rel='noopener noreferrer' className='text-gray-400 hover:text-white'>
                  Github
                </Footer.Link>
                <Footer.Link href='https://linkedin.com/in/yourusername' target='_blank' rel='noopener noreferrer' className='text-gray-400 hover:text-white'>
                  LinkedIn
                </Footer.Link>
                <Footer.Link href='#' className='text-gray-400 hover:text-white'>Discord</Footer.Link>
              </Footer.LinkGroup>
            </div>
            <div>
              <Footer.Title title='Legal' className='text-white' />
              <Footer.LinkGroup col>
                <Footer.Link as={Link} to='/privacy-policy' className='text-gray-400 hover:text-white'>Privacy Policy</Footer.Link>
                <Footer.Link as={Link} to='/terms-and-conditions' className='text-gray-400 hover:text-white'>Terms & Conditions</Footer.Link>
              </Footer.LinkGroup>
            </div>
          </div>
        </div>
        <Footer.Divider className='border-gray-700' /> 
        <div className='w-full sm:flex sm:items-center sm:justify-between'>
          <Footer.Copyright
            as={Link} to='/'
            by="KubeCloudAI™"
            year={new Date().getFullYear()}
            className='text-gray-400 hover:text-white' 
          />
          <div className="mt-4 flex space-x-6 sm:mt-0 sm:justify-center">
            <Footer.Icon href='#' icon={BsFacebook} className='text-gray-400 hover:text-white'/>
            <Footer.Icon href='#' icon={BsInstagram} className='text-gray-400 hover:text-white'/>
            <Footer.Icon href='#' icon={BsTwitter} className='text-gray-400 hover:text-white'/>
            <Footer.Icon href='https://github.com/yourusername' target='_blank' rel='noopener noreferrer' icon={BsGithub} className='text-gray-400 hover:text-white'/>
            <Footer.Icon href='#' icon={BsDribbble} className='text-gray-400 hover:text-white'/>
          </div>
        </div>
      </div>
    </Footer>
  );
}
import { BrowserRouter , Routes ,Route } from "react-router-dom"
import Home from './pages/Home';
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import DashBoard from "./pages/DashBoard";
import Contact from "./pages/Contact";
import Header from './components/Header'
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import AdminPrivateRoute from "./components/AdminPrivateRoute";
import CreatePost from "./pages/CreatePost";
import UpdatePost from "./pages/UpdatePost";
import PostPage from "./pages/PostPage";
import Search from "./pages/Search";
import  { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie'
import jwt_decode from 'jwt-decode';
import { signoutSuccess } from './redux/user/userSlice';
export default  function App(){

    const dispatch = useDispatch();

    useEffect(() => {
      const token = Cookies.get('token');
      
      if (token) {
        const decodedToken = jwt_decode(token);
        const expiryTime = decodedToken.exp * 1000; 
        const timeUntilExpiry = expiryTime - Date.now();
  
        // Automatically log out when the token expires
        setTimeout(() => {
          dispatch(signoutSuccess());  
          Cookies.remove('token');  
          window.location.href = '/login';  
        }, timeUntilExpiry);
      }
    }, [dispatch]);

    return(
     <BrowserRouter>
     <Header />
     <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/about" element={<About />}/>
        <Route path="/sign-in" element={<SignIn />}/>
        <Route path="/sign-up" element={<SignUp />}/>
        <Route path="/search" element={<Search />}/>
<Route element={<PrivateRoute/>}>
<Route path="/dashboard" element={<DashBoard />}/>
</Route>
<Route element={<AdminPrivateRoute />}>
<Route path="/create-post" element={<CreatePost />} />
<Route path="/update-post/:postId" element={<UpdatePost />} />
</Route>
<Route path="/contact" element={<Contact />}/>
<Route path="/post/:postSlug" element={<PostPage />}/>
     </Routes>
     <Footer/>
     </BrowserRouter>
    )
}
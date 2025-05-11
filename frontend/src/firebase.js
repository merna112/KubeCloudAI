// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDts5XHxDjaFAFZU7d8TYgg-j7fZZG0JrE",
  authDomain: "fullstack-blog-9b25f.firebaseapp.com",
  projectId: "fullstack-blog-9b25f",
  storageBucket: "fullstack-blog-9b25f.appspot.com",
  messagingSenderId: "906951963054",
  appId: "1:906951963054:web:af8c53d07ba2c88b6a983f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;

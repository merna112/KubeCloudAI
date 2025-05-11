import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDts5XHxDjaFAFZU7d8TYgg-j7fZZG0JrE", // استخدمي متغيرات البيئة أولاً
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fullstack-blog-9b25f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fullstack-blog-9b25f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fullstack-blog-9b25f.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "906951963054",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:906951963054:web:af8c53d07ba2c88b6a983f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const authInstance = getAuth(app); 

export { authInstance as auth }; 

export default app;
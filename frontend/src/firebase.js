import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDIs5XHXDjaFAfZU7d8TYgg-j7IZZG0JrE",
  authDomain: "fullstack-blog-9b25f.firebaseapp.com",
  projectId: "fullstack-blog-9b25f",
  storageBucket: "fullstack-blog-9b25f.appspot.com",
  messagingSenderId: "906951963054",
  appId: "1:906951963054:web:af8c53d07ba2c88b6a983f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();


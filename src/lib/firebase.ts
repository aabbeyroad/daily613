import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBfPGP771XgNdnBTQypbt-I_js3_7nuDAA",
  authDomain: "daily613-66a6f.firebaseapp.com",
  projectId: "daily613-66a6f",
  storageBucket: "daily613-66a6f.firebasestorage.app",
  messagingSenderId: "235603917791",
  appId: "1:235603917791:web:b03d70bda946a490f4e26a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

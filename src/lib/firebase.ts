import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCCavWQp91R7ceCHnZ0-eAtWgP5ZstKK1g",
  authDomain: "pre-decide.firebaseapp.com",
  projectId: "pre-decide",
  storageBucket: "pre-decide.firebasestorage.app",
  messagingSenderId: "910117950661",
  appId: "1:910117950661:web:4f0aa51649a6da162d4cac",
  measurementId: "G-4DVBDC3N30"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

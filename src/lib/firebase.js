import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBNt7TakKVGS1VZTz4ya9kf2-gkAUzXq5k",
  authDomain: "webdashboardptapt.firebaseapp.com",
  databaseURL: "https://webdashboardptapt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "webdashboardptapt",
  storageBucket: "webdashboardptapt.firebasestorage.app",
  messagingSenderId: "383764904540",
  appId: "1:383764904540:web:5caf9cbb688519e8e20499"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
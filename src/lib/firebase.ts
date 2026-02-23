import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
// For AI Studio, we'll use environment variables or a placeholder config
// Users should replace these with their actual Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCcxqGu5Aob8SsAxBEFu5cQYkKxtPtfjBo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gloves-3df80.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://gloves-3df80-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gloves-3df80",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gloves-3df80.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "652069975833",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:652069975833:android:8b7814eb63db39ed587788"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);

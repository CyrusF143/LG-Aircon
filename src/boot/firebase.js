import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyACb9CGVgCDvwpgOiiTtcXjKhR0SPMVmbA',
  authDomain: 'test-auth-c5a7a.firebaseapp.com',
  databaseURL: 'https://test-auth-c5a7a-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'test-auth-c5a7a',
  storageBucket: 'test-auth-c5a7a.firebasestorage.app',
  messagingSenderId: '426654487747',
  appId: '1:426654487747:web:1bd3ddc8215fd771eafe76',
  measurementId: 'G-S640XE3P3N'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const firestore = getFirestore(app);

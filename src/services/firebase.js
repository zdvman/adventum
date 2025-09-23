// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'REDACTED',
  authDomain: 'adventum-6f3a6.firebaseapp.com',
  projectId: 'adventum-6f3a6',
  storageBucket: 'adventum-6f3a6.firebasestorage.app',
  messagingSenderId: '92909289954',
  appId: '1:92909289954:web:6eaa8b65ea9207099db9bb',
  measurementId: 'G-MVLSHFSLXZ',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

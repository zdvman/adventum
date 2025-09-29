// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const cfgString = import.meta.env.VITE_FIREBASE_CONFIG;
const firebaseConfig = cfgString ? JSON.parse(cfgString) : {};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export let analytics;
if (typeof window !== 'undefined' && typeof getAnalytics === 'function') {
  analytics = getAnalytics(app);
}

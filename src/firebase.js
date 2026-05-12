// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBNR8pWpb3lzMVchggz-hF-PHWo5sDCrI",
  authDomain: "optimum-shape-496110-q1.firebaseapp.com",
  projectId: "optimum-shape-496110-q1",
  storageBucket: "optimum-shape-496110-q1.firebasestorage.app",
  messagingSenderId: "151849277364",
  appId: "1:151849277364:web:a10af39a62db54ac3044e1",
  measurementId: "G-CYHL3D69R2"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);

// Connect to the local emulator for development
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
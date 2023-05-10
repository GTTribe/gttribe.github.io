// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCfFWoiOidBO8vVtpUCoYGHyxw4Uox1J-U",
  authDomain: "tribe-db-7880b.firebaseapp.com",
  projectId: "tribe-db-7880b",
  storageBucket: "tribe-db-7880b.appspot.com",
  messagingSenderId: "772231149005",
  appId: "1:772231149005:web:54799bbd9099248e1dc084",
  measurementId: "G-96XK060MBG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);
export { db };
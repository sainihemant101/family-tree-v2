import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1T9V0oHvGmPsSIACOoC8c0Yfl_RMbGJQ",
  authDomain: "family-tree-810bc.firebaseapp.com",
  projectId: "family-tree-810bc",
  storageBucket: "family-tree-810bc.firebasestorage.app",
  messagingSenderId: "668032967833",
  appId: "1:668032967833:web:2928ab0f8275dd7a6d0408",
  measurementId: "G-4T9E3873JR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and export it for use in the app
export const db = getFirestore(app);

// Enable offline caching and sync
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence.");
  }
});
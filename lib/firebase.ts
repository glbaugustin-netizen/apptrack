import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFT7XirqSjIMspBbxcn9gIz7rP-X3CfRw",
  authDomain: "apptrack-e55fe.firebaseapp.com",
  projectId: "apptrack-e55fe",
  storageBucket: "apptrack-e55fe.firebasestorage.app",
  messagingSenderId: "720245003781",
  appId: "1:720245003781:web:bb8792dfbeaca498626e6c",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

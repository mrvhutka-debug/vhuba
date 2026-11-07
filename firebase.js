import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCB5VZva_ZWdQCj9hh-zjnYoW7AWkkE69E",
  authDomain: "vhuba-fe32e.firebaseapp.com",
  projectId: "vhuba-fe32e",
  storageBucket: "vhuba-fe32e.firebasestorage.app",
  messagingSenderId: "340615870548",
  appId: "1:340615870548:web:7341b09ca81354b1d895c1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser,
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, writeBatch
};
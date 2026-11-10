import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendEmailVerification, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential,
  updatePassword, deleteUser, GoogleAuthProvider, signInWithPopup, reauthenticateWithPopup,
  PhoneAuthProvider, RecaptchaVerifier, updatePhoneNumber, linkWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, writeBatch, getCountFromServer
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
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LfzqBguAAAAAEtcSefF1Ltqglndc-LmoU68t5IA"),
  isTokenAutoRefreshEnabled: true
});
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendEmailVerification, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential,
  updatePassword, deleteUser, GoogleAuthProvider, signInWithPopup, reauthenticateWithPopup,
  PhoneAuthProvider, RecaptchaVerifier, updatePhoneNumber, linkWithCredential,
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, writeBatch, getCountFromServer
};
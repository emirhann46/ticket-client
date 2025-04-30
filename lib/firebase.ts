// Firebase yapılandırma
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';

// Firebase yapılandırma bilgileri - Firebase konsolundan alınan
const firebaseConfig = {
  apiKey: "AIzaSyAqESs0MtaQi8IvDzJ5KD1ULQ5tjp3eqXA",
  authDomain: "event-ticket-app-4595c.firebaseapp.com",
  projectId: "event-ticket-app-4595c",
  storageBucket: "event-ticket-app-4595c.firebasestorage.app",
  messagingSenderId: "881301421643",
  appId: "1:881301421643:web:62b8b115e57936d03f97ce",
  measurementId: "G-29L0M10Q5W"
};

// Firebase app instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase auth instance
const auth = getAuth(app);

// Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firebase Authentication fonksiyonları
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error('Google ile giriş hatası:', error);
    throw error;
  }
};

export const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error: any) {
    console.error('Email/Şifre ile giriş hatası:', error);
    throw error;
  }
};

export const registerWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error: any) {
    console.error('Kayıt hatası:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error: any) {
    console.error('Şifre sıfırlama hatası:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error: any) {
    console.error('Çıkış hatası:', error);
    throw error;
  }
};

export { auth };
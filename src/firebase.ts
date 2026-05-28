import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDoc, getDocFromServer, deleteField, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with experimentalForceLongPolling to prevent "client is offline" errors
// in certain restricted network environments (like some iframe/proxy setups).
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, (firebaseConfig as any).firestoreDatabaseId);
} catch (error) {
  console.warn("Failed to initialize Firestore with settings, falling back to default", error);
  dbInstance = initializeFirestore(app, {}, (firebaseConfig as any).firestoreDatabaseId);
}

export const db = dbInstance;

export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDoc, getDocFromServer, deleteField, writeBatch };
export type { User };

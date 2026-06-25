import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";
import { PlannerState, ThemeType, UserProfile } from "../types";

// Firebase Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCGYFCa5F6uBoyolTHaYgsNJXpj-AUzAKw",
  authDomain: "gen-lang-client-0611806509.firebaseapp.com",
  projectId: "gen-lang-client-0611806509",
  storageBucket: "gen-lang-client-0611806509.firebasestorage.app",
  messagingSenderId: "411953205516",
  appId: "1:411953205516:web:c91944fa47e13785d4f929"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  databaseId: "ai-studio-abf0e318-3b2a-4de9-b666-b8e04d39b3b0"
} as any);

// Helper: Save planner state & theme to Cloud Firestore
export async function savePlannerData(userId: string, state: PlannerState, theme: ThemeType) {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, {
      state,
      theme,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving planner data to Firestore:", error);
  }
}

// Helper: Save user profile to Cloud Firestore
export async function saveUserProfile(userId: string, profile: UserProfile) {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, {
      profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user profile to Firestore:", error);
  }
}

// Helper: Fetch planner state & theme from Cloud Firestore
export async function fetchPlannerData(userId: string): Promise<{ state: PlannerState; theme: ThemeType; profile?: UserProfile } | null> {
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.state) {
        return {
          state: data.state as PlannerState,
          theme: (data.theme || "natural-tones") as ThemeType,
          profile: data.profile as UserProfile
        };
      }
    }
  } catch (error) {
    console.error("Error fetching planner data from Firestore:", error);
  }
  return null;
}


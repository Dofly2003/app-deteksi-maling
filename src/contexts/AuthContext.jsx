import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { auth, db, googleProvider } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await setDoc(
            doc(db, "users", firebaseUser.uid),
            {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
              photoURL: firebaseUser.photoURL || null,
              provider: firebaseUser.providerData[0]?.providerId || "password",
              lastLogin: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          console.error("Save profile failed:", err);
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // === GOOGLE SIGN IN ===
  const loginWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (!result?.credential?.idToken) {
        throw new Error("Gagal mendapatkan token dari Google");
      }
      const credential = GoogleAuthProvider.credential(
        result.credential.idToken,
        result.credential.accessToken
      );
      await signInWithCredential(auth, credential);
    } else {
      await signInWithPopup(auth, googleProvider);
    }
  };

  // === EMAIL / PASSWORD LOGIN ===
  const loginWithEmail = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // === EMAIL / PASSWORD REGISTER ===
  const registerWithEmail = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    return result;
  };

  // === RESET PASSWORD ===
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  // === LOGOUT ===
  const logout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        try { await FirebaseAuthentication.signOut(); } catch {}
      }
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
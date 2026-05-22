import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, collection, getDocs } from "firebase/firestore";
import { ref, update } from "firebase/database";
import { useAuth } from "./AuthContext";
import { db, rtdb } from "../lib/firebase";

const SettingsContext = createContext(null);

const DEFAULTS = {
  globalArmed: true,
  alarmSoundEnabled: true,
  alarmVolume: 80,
  vibrationEnabled: true,
  globalSchedule: { enabled: false, start: "22:00", end: "06:00" },
};

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const sRef = doc(db, "users", user.uid, "preferences", "main");
    return onSnapshot(sRef, (snap) => {
      if (snap.exists()) setSettings({ ...DEFAULTS, ...snap.data() });
      else { setSettings(DEFAULTS); setDoc(sRef, DEFAULTS); }
      setLoading(false);
    });
  }, [user]);

  const updateSetting = async (key, value) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "preferences", "main"),
      { [key]: value }, { merge: true });
  };

  // Toggle global armed → fan out ke semua device
  const toggleGlobalArmed = async () => {
    if (!user) return;
    const newValue = !settings.globalArmed;
    await updateSetting("globalArmed", newValue);
    const devs = await getDocs(collection(db, "users", user.uid, "devices"));
    await Promise.all(devs.docs.map((d) =>
      update(ref(rtdb, `devices/${d.id}/config`), { armed: newValue })
    ));
  };

  const applyGlobalSchedule = async () => {
    if (!user) return;
    const devs = await getDocs(collection(db, "users", user.uid, "devices"));
    await Promise.all(devs.docs.map((d) =>
      update(ref(rtdb, `devices/${d.id}/config/schedule`), settings.globalSchedule)
    ));
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSetting, toggleGlobalArmed, applyGlobalSchedule }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
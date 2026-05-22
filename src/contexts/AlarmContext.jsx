import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const AlarmContext = createContext(null);

export function AlarmProvider({ children }) {
  const [activeAlarm, setActiveAlarm] = useState(null);
  const audioRef = useRef(null);
  const vibrateIntervalRef = useRef(null);
  const autoStopRef = useRef(null);

  const stopAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    setActiveAlarm(null);
  }, []);

  const startAlarm = useCallback((device, alert, settings = {}) => {
    // Kalau ada alarm aktif, stop dulu sebelum mulai baru
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setActiveAlarm({ device, alert });

    // Loop audio
    if (settings.alarmSoundEnabled !== false) {
      const audio = new Audio("/alarm.mp3");
      audio.loop = true;
      audio.volume = (settings.alarmVolume ?? 80) / 100;
      audio.play().catch((e) => console.error("Audio play failed:", e));
      audioRef.current = audio;
    }

    // Loop vibration (native saja)
    if (settings.vibrationEnabled !== false && Capacitor.isNativePlatform()) {
      vibrateIntervalRef.current = setInterval(async () => {
        try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
      }, 600);
    }

    // Auto-stop setelah 2 menit (safety)
    autoStopRef.current = setTimeout(() => stopAlarm(), 120000);
  }, [stopAlarm]);

  useEffect(() => () => stopAlarm(), [stopAlarm]);

  return (
    <AlarmContext.Provider value={{ activeAlarm, startAlarm, stopAlarm }}>
      {children}
    </AlarmContext.Provider>
  );
}

export const useAlarm = () => useContext(AlarmContext);
import { useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { useAlarm } from "../contexts/AlarmContext";
import { db, rtdb } from "../lib/firebase";
import { triggerAlertNotification } from "../lib/notifications";

export function useAlertNotifications() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { startAlarm } = useAlarm();
  const settingsRef = useRef(settings);
  const lastLaserRef = useRef({});

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    if (!user) return;
    let unsubs = [];

    const cleanup = onSnapshot(collection(db, "users", user.uid, "devices"), (snap) => {
      unsubs.forEach((u) => u());
      unsubs = [];

      snap.docs.forEach((d) => {
        const device = { id: d.id, ...d.data() };

        const unsub = onValue(ref(rtdb, `devices/${d.id}`), (snap) => {
          const dev = snap.val();
          if (!dev?.sensor?.laser) return;

          const newLaser = dev.sensor.laser;
          const lastLaser = lastLaserRef.current[d.id];
          const armed = dev.config?.armed ?? false;
          const laserOn = dev.config?.laser_on ?? false;

          console.log(`[Notif] ${d.id}: ${lastLaser}→${newLaser} armed=${armed} laserOn=${laserOn}`);

          // HANYA trigger kalau: armed ON, laser ON, transisi NORMAL→BLOCKED
          if (armed && laserOn && lastLaser === "NORMAL" && newLaser === "BLOCKED") {
            console.log("🚨 ALARM:", d.id);
            const alertData = {
              timestamp: Math.floor(Date.now() / 1000),
              waktu: new Date().toLocaleTimeString("id-ID"),
              status: "TERDETEKSI",
            };
            startAlarm(device, alertData, settingsRef.current);
            triggerAlertNotification(device, alertData, settingsRef.current);
          }

          lastLaserRef.current[d.id] = newLaser;
        });

        unsubs.push(unsub);
      });
    });

    return () => {
      unsubs.forEach((u) => u());
      cleanup();
    };
  }, [user, startAlarm]);
}
import { useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "../contexts/AuthContext";
import { db, rtdb } from "../lib/firebase";

function isInSchedule(start, end) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (startMin === endMin) return false;
  if (startMin < endMin) return nowMin >= startMin && nowMin < endMin;
  return nowMin >= startMin || nowMin < endMin;  // melewati midnight
}

export function useScheduleLaserControl() {
  const { user } = useAuth();
  const configsRef = useRef(new Map()); // deviceId -> latest config

  useEffect(() => {
    if (!user) return;
    let deviceUnsubs = [];

    const colUnsub = onSnapshot(collection(db, "users", user.uid, "devices"), (snap) => {
      deviceUnsubs.forEach((u) => u());
      deviceUnsubs = [];
      configsRef.current.clear();

      snap.docs.forEach((d) => {
        const deviceId = d.id;
        const unsub = onValue(ref(rtdb, `devices/${deviceId}/config`), (s) => {
          configsRef.current.set(deviceId, s.val() || {});
        });
        deviceUnsubs.push(unsub);
      });
    });

    // Cek tiap 30 detik
    const tick = () => {
      configsRef.current.forEach((cfg, deviceId) => {
        if (!cfg.schedule?.enabled) return;
        const shouldOn = isInSchedule(cfg.schedule.start, cfg.schedule.end);
        // Update HANYA kalau berbeda (hindari spam write)
        if (cfg.laser_on !== shouldOn) {
          console.log(`[Schedule] ${deviceId}: laser_on=${shouldOn}`);
          update(ref(rtdb, `devices/${deviceId}/config`), { laser_on: shouldOn });
        }
      });
    };

    tick(); // langsung jalankan sekali
    const interval = setInterval(tick, 30000);

    return () => {
      clearInterval(interval);
      deviceUnsubs.forEach((u) => u());
      colUnsub();
    };
  }, [user]);
}
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const isNative = Capacitor.isNativePlatform();
let webAudio = null;

export async function initNotifications() {
  if (!isNative) {
    webAudio = new Audio("/alarm.mp3");
    webAudio.preload = "auto";
    return;
  }
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") await LocalNotifications.requestPermissions();
  await LocalNotifications.createChannel({
    id: "alarm-channel",
    name: "Alarm Deteksi",
    description: "Notifikasi alarm",
    sound: "alarm.mp3",
    importance: 5,
    visibility: 1,
    lights: true,
    lightColor: "#FF0000",
    vibration: true,
  });
}

export async function triggerAlertNotification(device, alert, settings = {}) {
  const soundOn = settings.alarmSoundEnabled !== false;
  const vibrate = settings.vibrationEnabled !== false;
  const volume  = (settings.alarmVolume ?? 80) / 100;

  if (isNative) {
    if (vibrate) {
      for (let i = 0; i < 3; i++) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() / 1000) % 2147483647,
        title: `⚠ ${device.nickname || device.id}`,
        body: `Maling terdeteksi pukul ${alert.waktu}`,
        channelId: "alarm-channel",
        sound: soundOn ? "alarm.mp3" : undefined,
        smallIcon: "ic_stat_icon_config_sample",
        autoCancel: true,
        extra: { deviceId: device.id },
      }],
    });
  } else {
    if (soundOn && webAudio) {
      try { webAudio.volume = volume; webAudio.currentTime = 0; webAudio.play().catch(() => {}); } catch {}
    }
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`⚠ ${device.nickname || device.id}`, {
        body: `Maling terdeteksi pukul ${alert.waktu}`,
      });
    }
  }
}
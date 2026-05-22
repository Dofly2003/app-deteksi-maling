import { useAlarm } from "../contexts/AlarmContext";
import { AlertTriangle, BellOff } from "lucide-react";

export default function AlarmModal() {
  const { activeAlarm, stopAlarm } = useAlarm();
  if (!activeAlarm) return null;

  const { device, alert } = activeAlarm;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-red-600 alarm-pulse">
      <div className="text-center mb-12">
        <AlertTriangle size={140} className="text-white mx-auto mb-4 alarm-shake" />
        <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
          ⚠ MALING
        </h1>
        <h1 className="text-5xl font-black text-white mb-6 tracking-tight">
          TERDETEKSI!
        </h1>
        <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-3 inline-block">
          <p className="text-white text-2xl font-bold">{device.nickname || device.id}</p>
          <p className="text-white text-lg opacity-90 mt-1">{alert.waktu}</p>
        </div>
      </div>

      <button
        onClick={stopAlarm}
        className="bg-white text-red-600 px-10 py-5 rounded-full text-xl font-black shadow-2xl flex items-center gap-3 active:scale-95 transition-all hover:bg-gray-100"
      >
        <BellOff size={32} />
        MATIKAN ALARM
      </button>

      <p className="text-white/80 text-xs mt-6">Auto-stop dalam 2 menit</p>

      <style>{`
        .alarm-pulse {
          animation: alarmPulse 0.8s ease-in-out infinite;
        }
        @keyframes alarmPulse {
          0%, 100% { background-color: #dc2626; }
          50% { background-color: #991b1b; }
        }
        .alarm-shake {
          animation: alarmShake 0.5s ease-in-out infinite;
        }
        @keyframes alarmShake {
          0%, 100% { transform: rotate(-5deg) scale(1); }
          50% { transform: rotate(5deg) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
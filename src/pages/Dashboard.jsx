import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { Plus, Wifi, WifiOff, AlertTriangle, ChevronRight, Zap, ZapOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { db, rtdb } from "../lib/firebase";
import Layout from "../components/Layout";

export default function Dashboard() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users", user.uid, "devices"), (snap) => {
      setDevices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  useEffect(() => {
    const unsubs = devices.map((dev) =>
      onValue(ref(rtdb, `devices/${dev.id}`), (snap) => {
        const v = snap.val() || {};
        const online = Date.now() - (v.info?.last_seen || 0) < 60000;
        setStatuses((s) => ({ ...s, [dev.id]: { online, ...v } }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [devices]);

  const onlineCount = devices.filter((d) => statuses[d.id]?.online).length;
  
  // FIX: alert cuma kalau armed ON, laser ON, dan BLOCKED
  const alertCount = devices.filter((d) => {
    const s = statuses[d.id];
    return s?.config?.armed && s?.config?.laser_on && s?.sensor?.laser === "BLOCKED";
  }).length;

  return (
    <Layout>
      <header className="px-4 pt-10 pb-6 bg-gradient-to-b from-indigo-50/50 to-transparent">
        <p className="text-sm text-slate-500">Halo,</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {user.displayName?.split(" ")[0] || "User"} 👋
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Total" value={devices.length} color="indigo" />
          <Stat label="Online" value={onlineCount} color="emerald" />
          <Stat label="Alert" value={alertCount} color="red" />
        </div>

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
            Perangkat
          </h2>
          <Link to="/add-device" className="text-indigo-600 text-sm font-semibold flex items-center gap-1">
            <Plus size={16} /> Tambah
          </Link>
        </div>

        {devices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-slate-600 mb-1 font-medium">Belum ada perangkat</p>
            <p className="text-xs text-slate-400 mb-4">Tambahkan alat pertama Anda</p>
            <Link to="/add-device" className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition">
              <Plus size={16} /> Tambah Perangkat
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => (
              <DeviceCard key={d.id} device={d} status={statuses[d.id]} />
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}

const COLORS = {
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
};

function Stat({ label, value, color }) {
  return (
    <div className={`rounded-2xl p-4 ${COLORS[color]}`}>
      <div className="text-2xl font-bold leading-tight">{value}</div>
      <div className="text-xs font-semibold opacity-80 mt-0.5">{label}</div>
    </div>
  );
}

function DeviceCard({ device, status }) {
  const online = status?.online;
  const armed = status?.config?.armed;
  const laserOn = status?.config?.laser_on;
  
  // FIX: badge ALERT cuma kalau armed ON, laser ON, dan BLOCKED
  const isAlert = armed && laserOn && status?.sensor?.laser === "BLOCKED";

  return (
    <Link
      to={`/device/${device.id}`}
      className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-slate-900 truncate">{device.nickname || device.id}</div>
            {isAlert && (
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <AlertTriangle size={10} /> ALERT
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{device.id}</div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1">
              {online ? <Wifi size={11} className="text-emerald-500" /> : <WifiOff size={11} className="text-slate-400" />}
              <span className={online ? "text-emerald-600 font-medium" : "text-slate-400"}>
                {online ? "Online" : "Offline"}
              </span>
            </span>
            <span className={`font-medium ${armed ? "text-indigo-600" : "text-slate-400"}`}>
              {armed ? "● Armed" : "○ Off"}
            </span>
            <span className="flex items-center gap-0.5">
              {laserOn ? <Zap size={11} className="text-amber-500" /> : <ZapOff size={11} className="text-slate-300" />}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
      </div>
    </Link>
  );
}
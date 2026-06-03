import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { ref, onValue, update, set, query, orderByChild, limitToLast } from "firebase/database";
import { ChevronLeft, Trash2, Wifi, WifiOff, Clock, Power, FlaskConical } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { db, rtdb } from "../lib/firebase";
import Layout from "../components/Layout";

export default function DeviceDetail() {
  const { deviceId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => onSnapshot(doc(db, "users", user.uid, "devices", deviceId),
    (s) => setMeta(s.data())), [user, deviceId]);

  useEffect(() => onValue(ref(rtdb, `devices/${deviceId}`), (s) =>
    setData(s.val() || {})), [deviceId]);

  useEffect(() => {
    const q = query(ref(rtdb, `devices/${deviceId}/alerts`),
      orderByChild("timestamp"), limitToLast(20));
    return onValue(q, (s) => {
      const arr = [];
      s.forEach((c) => arr.push({ id: c.key, ...c.val() }));
      setAlerts(arr.reverse());
    });
  }, [deviceId]);

  const online = data.info?.last_seen ? Date.now() - data.info.last_seen < 60000 : false;
  const cfg = data.config || {};
  const sensor = data.sensor || {};
  
  // FIX: isAlert hanya saat armed ON, laser ON, dan BLOCKED
  const isAlert = cfg.armed && cfg.laser_on && sensor.laser === "BLOCKED";

  const setCfg = (key, value) => update(ref(rtdb, `devices/${deviceId}/config`), { [key]: value });
  const setSched = (key, value) => set(ref(rtdb, `devices/${deviceId}/config/schedule/${key}`), value);

  const handleRemove = async () => {
    if (!confirm("Hapus device dari akun? Device akan bisa di-claim oleh user lain.")) return;
    try {
      await set(ref(rtdb, `devices/${deviceId}/owner`), "");
      await deleteDoc(doc(db, "users", user.uid, "devices", deviceId));
      nav("/");
    } catch (err) {
      alert("Gagal hapus: " + err.message);
    }
  };

  return (
    <Layout>
      <header className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-40">
        <Link to="/" className="text-slate-600 hover:text-slate-900">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-slate-900 truncate">{meta?.nickname || deviceId}</h1>
          <p className="text-[11px] text-slate-400 font-mono truncate">{deviceId}</p>
        </div>
        <Link to={`/simulate/${deviceId}`} className="text-amber-500 hover:text-amber-600 p-1" title="Simulator">
          <FlaskConical size={18} />
        </Link>
        <button onClick={handleRemove} className="text-red-500 hover:text-red-700 p-1">
          <Trash2 size={18} />
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Status Banner */}
        <div className={`rounded-2xl p-5 ${isAlert ? "bg-red-50 border-2 border-red-200" : "bg-white shadow-sm"}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isAlert ? "text-red-600" : "text-slate-500"}`}>
                {isAlert ? "⚠ Terhalang" : "Status"}
              </div>
              <div className={`text-2xl font-bold ${isAlert ? "text-red-700" : "text-slate-900"}`}>
                {sensor.laser || "—"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {online ? <Wifi className="text-emerald-500" size={20} /> : <WifiOff className="text-slate-400" size={20} />}
              <span className={`text-sm font-medium ${online ? "text-emerald-600" : "text-slate-400"}`}>
                {online ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Kontrol */}
        <Section icon={<Power size={14} />} title="Kontrol">
          <Toggle label="Sistem Armed" desc="Aktifkan deteksi alarm"
            value={cfg.armed ?? false} onChange={(v) => setCfg("armed", v)} />
          <div className="pt-3 border-t border-slate-100">
            <Toggle label="Laser Nyala" desc="Daya laser fisik"
              value={cfg.laser_on ?? false} onChange={(v) => setCfg("laser_on", v)} />
          </div>
        </Section>

        {/* Jadwal */}
        <Section icon={<Clock size={14} />} title="Jadwal Aktif">
          <Toggle label="Aktifkan Jadwal" desc="Laser & alarm otomatis off di luar jam"
            value={cfg.schedule?.enabled ?? false} onChange={(v) => setSched("enabled", v)} />
          {cfg.schedule?.enabled && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <Time label="Mulai" value={cfg.schedule?.start || "22:00"} onChange={(v) => setSched("start", v)} />
              <Time label="Selesai" value={cfg.schedule?.end || "06:00"} onChange={(v) => setSched("end", v)} />
            </div>
          )}
        </Section>

        {/* Info */}
        <Section title="Info">
          <Info label="IP" value={data.info?.ip || "-"} />
          <Info label="RSSI" value={`${data.info?.rssi ?? "-"} dBm`} />
          <Info label="Firmware" value={data.info?.firmware || "-"} />
          <Info label="Uptime" value={`${data.info?.uptime_sec ?? 0}s`} />
        </Section>

        {/* Riwayat */}
        <Section title="Riwayat Alarm">
          {alerts.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-2">Belum ada riwayat</div>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {alerts.map((a) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-red-600 font-medium">⚠ {a.status}</span>
                  <span className="text-slate-500 text-xs font-mono">
                    {new Date(a.timestamp * 1000).toLocaleString("id-ID")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </main>
    </Layout>
  );
}

function Section({ icon, title, children }) {
  return (
    <div>
      <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
        {icon}{title}
      </h2>
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 pr-3">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${value ? "bg-indigo-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function Time({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none focus:bg-white focus:border-indigo-500" />
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
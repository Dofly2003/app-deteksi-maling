import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { ref, onValue, update, set } from "firebase/database";
import { ChevronLeft, Zap, Radio, Activity, Wifi, WifiOff, Shield, ShieldOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { db, rtdb } from "../lib/firebase";

export default function DeviceSimulator() {
  const { deviceId } = useParams();
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState({});

  useEffect(
    () =>
      onSnapshot(
        doc(db, "users", user.uid, "devices", deviceId),
        (s) => setMeta(s.data())
      ),
    [user, deviceId]
  );

  useEffect(
    () => onValue(ref(rtdb, `devices/${deviceId}`), (s) => setData(s.val() || {})),
    [deviceId]
  );

  const cfg = data.config || {};
  const sensor = data.sensor || {};
  const online = data.info?.last_seen
    ? Date.now() - data.info.last_seen < 60000
    : false;

  const setCfg = (key, value) =>
    update(ref(rtdb, `devices/${deviceId}/config`), { [key]: value });
  const setSensor = (key, value) =>
    set(ref(rtdb, `devices/${deviceId}/sensor/${key}`), value);

  // Ketiga syarat agar alarm trigger
  const condArmed   = cfg.armed === true;
  const condLaserOn = cfg.laser_on === true;
  const condBlocked = sensor.laser === "BLOCKED";
  const allMet      = condArmed && condLaserOn && condBlocked;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="px-4 pt-10 pb-4 flex items-start gap-3 border-b border-slate-800">
        <Link
          to={`/device/${deviceId}`}
          className="mt-0.5 text-slate-400 hover:text-white transition"
        >
          <ChevronLeft size={24} />
        </Link>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
            🧪 Simulator Alat
          </span>
          <h1 className="text-lg font-bold truncate mt-0.5">
            {meta?.nickname || deviceId}
          </h1>
          <p className="text-[11px] text-slate-500 font-mono truncate">{deviceId}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {online ? (
            <Wifi size={14} className="text-emerald-400" />
          ) : (
            <WifiOff size={14} className="text-slate-600" />
          )}
          <span className={`text-xs font-semibold ${online ? "text-emerald-400" : "text-slate-600"}`}>
            {online ? "Online" : "Offline"}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4 pb-10">

        {/* ── Checklist syarat alarm ── */}
        <div className={`rounded-2xl p-4 border ${allMet ? "border-red-500/50 bg-red-500/10" : "border-slate-800 bg-slate-900"}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-slate-500">
            Syarat Trigger Alarm
          </p>
          <div className="space-y-2">
            <Cond met={condArmed}   label="config/armed = true"        />
            <Cond met={condLaserOn} label="config/laser_on = true"     />
            <Cond met={condBlocked} label='sensor/laser = "BLOCKED"'   note="harus melalui NORMAL dulu" />
          </div>
          {allMet && (
            <div className="mt-3 pt-3 border-t border-red-500/30 text-center">
              <span className="text-red-400 font-bold text-sm animate-pulse">🚨 SEMUA SYARAT TERPENUHI</span>
            </div>
          )}
          {!allMet && (
            <p className="mt-3 text-[10px] text-slate-600 text-center">
              Alarm hanya bunyi saat transisi NORMAL → BLOCKED
            </p>
          )}
        </div>

        {/* ── Armed ── */}
        <SimCard
          icon={<Shield size={16} />}
          title="Armed"
          rtdbPath={`devices/${deviceId}/config/armed`}
          status={cfg.armed ? "ON" : "OFF"}
          statusColor={cfg.armed ? "text-indigo-400" : "text-slate-500"}
          statusBg={cfg.armed ? "bg-indigo-400/10" : "bg-slate-800"}
        >
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SimButton
              active={cfg.armed === true}
              activeClass="bg-indigo-600 shadow-indigo-600/40 text-white"
              onClick={() => setCfg("armed", true)}
            >
              <Shield size={20} className="mx-auto mb-1" />
              ARMED
            </SimButton>
            <SimButton
              active={cfg.armed === false}
              activeClass="bg-slate-500 shadow-slate-500/30 text-white"
              onClick={() => setCfg("armed", false)}
            >
              <ShieldOff size={20} className="mx-auto mb-1 opacity-50" />
              DISARMED
            </SimButton>
          </div>
        </SimCard>

        {/* ── Laser ON/OFF ── */}
        <SimCard
          icon={<Zap size={16} />}
          title="Laser"
          rtdbPath={`devices/${deviceId}/config/laser_on`}
          status={cfg.laser_on ? "ON" : "OFF"}
          statusColor={cfg.laser_on ? "text-amber-400" : "text-slate-500"}
          statusBg={cfg.laser_on ? "bg-amber-400/10" : "bg-slate-800"}
        >
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SimButton
              active={cfg.laser_on === true}
              activeClass="bg-amber-500 shadow-amber-500/40 text-white"
              onClick={() => setCfg("laser_on", true)}
            >
              <Zap size={20} className="mx-auto mb-1" />
              ON
            </SimButton>
            <SimButton
              active={cfg.laser_on === false}
              activeClass="bg-slate-500 shadow-slate-500/30 text-white"
              onClick={() => setCfg("laser_on", false)}
            >
              <Zap size={20} className="mx-auto mb-1 opacity-30" />
              OFF
            </SimButton>
          </div>
        </SimCard>

        {/* ── Sensor Laser ── */}
        <SimCard
          icon={<Radio size={16} />}
          title="Sensor Laser"
          rtdbPath={`devices/${deviceId}/sensor/laser`}
          status={sensor.laser || "—"}
          statusColor={
            sensor.laser === "BLOCKED" ? "text-red-400" :
            sensor.laser === "NORMAL"  ? "text-emerald-400" : "text-slate-500"
          }
          statusBg={
            sensor.laser === "BLOCKED" ? "bg-red-500/10" :
            sensor.laser === "NORMAL"  ? "bg-emerald-500/10" : "bg-slate-800"
          }
        >
          {/* Petunjuk urutan */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-600">
            <span className={sensor.laser === "NORMAL" ? "text-emerald-400 font-bold" : ""}>NORMAL</span>
            <span>→</span>
            <span className={sensor.laser === "BLOCKED" ? "text-red-400 font-bold" : ""}>BLOCKED</span>
            <span className="text-slate-700 ml-1">(urutan ini untuk trigger alarm)</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <SimButton
              active={sensor.laser === "BLOCKED"}
              activeClass="bg-red-600 shadow-red-600/40 text-white"
              onClick={() => setSensor("laser", "BLOCKED")}
            >
              <div className="text-xl mb-1">🚫</div>
              BLOCKED
            </SimButton>
            <SimButton
              active={sensor.laser === "NORMAL"}
              activeClass="bg-emerald-600 shadow-emerald-600/40 text-white"
              onClick={() => setSensor("laser", "NORMAL")}
            >
              <div className="text-xl mb-1">✅</div>
              NORMAL
            </SimButton>
          </div>
        </SimCard>

        {/* ── LDR Raw ── */}
        <SimCard
          icon={<Activity size={16} />}
          title="LDR Raw"
          rtdbPath={`devices/${deviceId}/sensor/ldr_raw`}
          status={sensor.ldr_raw ?? "—"}
          statusColor="text-sky-400"
          statusBg="bg-sky-400/10"
        >
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SimButton
              active={sensor.ldr_raw === 1}
              activeClass="bg-sky-600 shadow-sky-600/40 text-white"
              onClick={() => setSensor("ldr_raw", 1)}
            >
              <div className="text-xl mb-1">💡</div>
              SET 1
            </SimButton>
            <SimButton
              active={sensor.ldr_raw === 0}
              activeClass="bg-slate-500 shadow-slate-500/30 text-white"
              onClick={() => setSensor("ldr_raw", 0)}
            >
              <div className="text-xl mb-1">🌑</div>
              RESET 0
            </SimButton>
          </div>
        </SimCard>

      </main>
    </div>
  );
}

function Cond({ met, label, note }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-0.5 text-base leading-none ${met ? "text-emerald-400" : "text-slate-700"}`}>
        {met ? "✓" : "✗"}
      </span>
      <div>
        <span className={`text-xs font-mono ${met ? "text-emerald-300" : "text-slate-500"}`}>
          {label}
        </span>
        {note && <p className="text-[10px] text-slate-700 mt-0.5">{note}</p>}
      </div>
    </div>
  );
}

function SimCard({ icon, title, rtdbPath, status, statusColor, statusBg, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
          {icon}
          {title}
        </div>
        <div className={`px-3 py-1 rounded-lg ${statusBg}`}>
          <span className={`text-sm font-bold font-mono ${statusColor}`}>{status}</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-700 font-mono mt-1">{rtdbPath}</p>
      {children}
    </div>
  );
}

function SimButton({ active, activeClass, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 rounded-2xl font-bold text-sm text-center transition active:scale-95 ${
        active
          ? `${activeClass} shadow-lg`
          : "bg-slate-800 text-slate-500 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

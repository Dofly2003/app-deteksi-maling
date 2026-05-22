import { Volume2, Bell, Clock, LogOut, Vibrate, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import Layout from "../components/Layout";

export default function Settings() {
  const { user, logout } = useAuth();
  const { settings, updateSetting, applyGlobalSchedule } = useSettings();

  const setSchedule = (patch) =>
    updateSetting("globalSchedule", { ...settings.globalSchedule, ...patch });

  return (
    <Layout>
      <header className="bg-white px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
        <p className="text-sm text-slate-500">Konfigurasi alarm & sistem</p>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-3 p-4">
            <img src={user.photoURL} className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 truncate">{user.displayName}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
        </Card>

        {/* Alarm */}
        <Section icon={<Bell size={14} />} title="Alarm">
          <Toggle
            label="Suara Alarm"
            desc="Putar suara saat alarm"
            value={settings.alarmSoundEnabled}
            onChange={(v) => updateSetting("alarmSoundEnabled", v)}
          />
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                <Volume2 size={14} /> Volume
              </span>
              <span className="text-sm font-semibold text-indigo-600">{settings.alarmVolume}%</span>
            </div>
            <input
              type="range" min="0" max="100"
              value={settings.alarmVolume}
              onChange={(e) => updateSetting("alarmVolume", parseInt(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
          <div className="pt-3 border-t border-slate-100">
            <Toggle
              label="Getar"
              desc="Getarkan HP saat alarm"
              value={settings.vibrationEnabled}
              onChange={(v) => updateSetting("vibrationEnabled", v)}
            />
          </div>
        </Section>

        {/* Global Schedule */}
        <Section icon={<Clock size={14} />} title="Jadwal Global">
          <Toggle
            label="Aktifkan Jadwal"
            desc="Alarm aktif hanya di rentang waktu ini"
            value={settings.globalSchedule.enabled}
            onChange={(v) => setSchedule({ enabled: v })}
          />
          {settings.globalSchedule.enabled && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <TimeInput label="Mulai" value={settings.globalSchedule.start} onChange={(v) => setSchedule({ start: v })} />
                <TimeInput label="Selesai" value={settings.globalSchedule.end} onChange={(v) => setSchedule({ end: v })} />
              </div>
              <button
                onClick={applyGlobalSchedule}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Terapkan ke Semua Perangkat
              </button>
            </div>
          )}
        </Section>

        {/* Account */}
        <Section icon={<User size={14} />} title="Akun">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-3 rounded-xl font-medium transition"
          >
            <LogOut size={18} /> Keluar
          </button>
        </Section>

        <p className="text-center text-xs text-slate-400 pt-2">Deteksi Maling v1.3</p>
      </main>
    </Layout>
  );
}

function Card({ children }) {
  return <div className="bg-white rounded-2xl shadow-sm overflow-hidden">{children}</div>;
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
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${value ? "bg-indigo-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function TimeInput({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      <input
        type="time" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
      />
    </div>
  );
}
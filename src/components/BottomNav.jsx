import { useLocation, useNavigate } from "react-router-dom";
import { Home, Settings, Power } from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";

export default function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const { settings, toggleGlobalArmed } = useSettings();
  const isActive = (p) => loc.pathname === p;
  const armed = settings.globalArmed;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 z-50">
      <div className="max-w-2xl mx-auto h-20 flex items-center justify-around relative">
        <button
          onClick={() => nav("/")}
          className={`flex flex-col items-center gap-1 transition ${isActive("/") ? "text-indigo-600" : "text-slate-400"}`}
        >
          <Home size={24} strokeWidth={2.2} />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        {/* Center FAB - Global On/Off */}
        <button
          onClick={toggleGlobalArmed}
          className={`absolute left-1/2 -translate-x-1/2 -top-7 w-[68px] h-[68px] rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${
            armed
              ? "bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-500/40"
              : "bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-300/40"
          }`}
        >
          <Power size={28} strokeWidth={2.5} className="text-white" />
        </button>
        <div className="w-20" />

        <button
          onClick={() => nav("/settings")}
          className={`flex flex-col items-center gap-1 transition ${isActive("/settings") ? "text-indigo-600" : "text-slate-400"}`}
        >
          <Settings size={24} strokeWidth={2.2} />
          <span className="text-[10px] font-semibold">Settings</span>
        </button>
      </div>
      <div className="text-[10px] text-center font-bold pb-1 -mt-2">
        <span className={armed ? "text-indigo-600" : "text-slate-400"}>
          {armed ? "● ARMED" : "○ DISARMED"}
        </span>
      </div>
    </nav>
  );
}
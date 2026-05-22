import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, get, set } from "firebase/database";
import { Plus, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { db, rtdb } from "../lib/firebase";
import Layout from "../components/Layout";

export default function AddDevice() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [deviceId, setDeviceId] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleClaim = async () => {
    setError("");
    setSuccess("");
    
    const id = deviceId.trim().toUpperCase();
    if (!id || !id.startsWith("DETEKSI-")) {
      setError("Format ID salah. Contoh: DETEKSI-8A2EEC");
      return;
    }
    if (!nickname.trim()) {
      setError("Nama device wajib diisi");
      return;
    }

    setLoading(true);
    try {
      // 1. Cek device exists di RTDB
      const deviceSnap = await get(ref(rtdb, `devices/${id}`));
      if (!deviceSnap.exists()) {
        setError(`Device ${id} tidak ditemukan. Pastikan device online dan ID benar.`);
        setLoading(false);
        return;
      }

      // 2. Cek ownership
      const ownerSnap = await get(ref(rtdb, `devices/${id}/owner`));
      const currentOwner = ownerSnap.exists() ? ownerSnap.val() : "";

      if (currentOwner && currentOwner !== user.uid) {
        setError("Device ini sudah diklaim oleh user lain. Hubungi pemilik untuk reset.");
        setLoading(false);
        return;
      }

      // 3. Claim: tulis owner = my UID
      await set(ref(rtdb, `devices/${id}/owner`), user.uid);

      // 4. Save metadata ke user's collection
      await setDoc(doc(db, "users", user.uid, "devices", id), {
        nickname: nickname.trim(),
        added_at: serverTimestamp(),
      });

      setSuccess(`Device ${id} berhasil diklaim!`);
      setTimeout(() => nav("/"), 1500);
    } catch (err) {
      console.error(err);
      setError("Gagal claim: " + (err.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <header className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => nav(-1)} className="text-slate-600">←</button>
        <h1 className="text-base font-bold">Tambah Device</h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-sm flex gap-2">
              <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Device ID</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="DETEKSI-8A2EEC"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 font-mono uppercase"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Device</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Pintu Depan"
              className="w-full border border-slate-200 rounded-xl px-4 py-3"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleClaim}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" />Claim...</>
            ) : (
              <><Plus size={20} />Tambah Device</>
            )}
          </button>
        </div>
      </main>
    </Layout>
  );
}
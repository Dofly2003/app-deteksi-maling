import BottomNav from "./BottomNav";

export default function Layout({ children, hideNav = false }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pb-28">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
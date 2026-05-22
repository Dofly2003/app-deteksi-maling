import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AlarmProvider } from "./contexts/AlarmContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AlarmModal from "./components/AlarmModal";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddDevice from "./pages/AddDevice";
import DeviceDetail from "./pages/DeviceDetail";
import Settings from "./pages/Settings";
import { initNotifications } from "./lib/notifications";
import { useAlertNotifications } from "./hooks/useAlertNotifications";
import { useScheduleLaserControl } from "./hooks/useScheduleLaserControl";

function NotificationListener() {
  useAlertNotifications();
  useScheduleLaserControl();
  return null;
}

export default function App() {
  useEffect(() => {
    initNotifications();
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
        <AlarmProvider>
          <NotificationListener />
          <AlarmModal />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-device"
                element={
                  <ProtectedRoute>
                    <AddDevice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/device/:deviceId"
                element={
                  <ProtectedRoute>
                    <DeviceDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AlarmProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
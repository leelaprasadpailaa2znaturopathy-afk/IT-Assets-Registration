import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { User } from "./types";
import { api, debugAuthState } from "./utils/api";
import LoginScreen from "./components/LoginScreen";
import MainLayout from "./components/MainLayout";
import DashboardView from "./components/DashboardView";
import AssetsView from "./components/AssetsView";
import MasterManagementView from "./components/MasterManagementView";
import ImportView from "./components/ImportView";
import ReportsView from "./components/ReportsView";
import UserManagementView from "./components/UserManagementView";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Perform session checking
    const verifySession = async () => {
      const savedToken = localStorage.getItem("tgh_token");
      const savedUserStr = localStorage.getItem("tgh_user");

      if (savedToken && savedUserStr) {
        try {
          console.log("[App] Verifying saved session...");
          const profile = await api.getMe();
          setUser(profile.user);
          setToken(savedToken);
          console.log("[App] Session verified successfully");
        } catch (err: any) {
          // Stale session - log and clear
          console.warn("[App] Session verification failed:", err.message);
          localStorage.removeItem("tgh_token");
          localStorage.removeItem("tgh_user");
        }
      }
      debugAuthState();
      setIsReady(true);
    };

    verifySession();
  }, []);

  const handleLoginSuccess = (verifiedUser: User, sessionToken: string) => {
    console.log("[App] Login successful, setting user and token");
    setUser(verifiedUser);
    setToken(sessionToken);
    debugAuthState();
  };

  const handleLogout = () => {
    console.log("[App] Logging out");
    localStorage.removeItem("tgh_token");
    localStorage.removeItem("tgh_user");
    setUser(null);
    setToken(null);
    debugAuthState();
  };

  if (!isReady) {
    return (
      <div id="splash-screen-auth" className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
        <span className="h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-slate-400">Decrypting authenticated secure networks...</span>
      </div>
    );
  }

  // Redirect to login form if not authenticated
  if (!user || !token) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout user={user} token={token} onLogout={handleLogout} />}>
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/assets" element={<AssetsView currentUser={user} />} />
          <Route path="/masters" element={<MasterManagementView currentUser={user} />} />
          <Route path="/import" element={<ImportView currentUser={user} />} />
          <Route path="/reports" element={<ReportsView currentUser={user} />} />
          <Route path="/users" element={<UserManagementView currentUser={user} />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
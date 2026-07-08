import React, { useEffect, useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { User, Asset } from "../types";
import { api } from "../utils/api";
import {
  Laptop, LayoutDashboard, Layers, KeyRound,
  Settings, LogOut, FileSearch, UserCheck, RefreshCw, UploadCloud,
  Search, Building, MapPin, Users, CheckCircle, Clock, Activity, ShieldAlert,
  Sun, Moon, Database, Trash2, UserCog
} from "lucide-react";

interface MainLayoutProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export default function MainLayout({ user, token, onLogout }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem("tgh_dark_mode") === "true"; } catch { return false; }
  });
  const [dbStatus, setDbStatus] = useState<{ mongoConnected: boolean; dbName: string; readyState: number } | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [resettingDb, setResettingDb] = useState(false);
  const [reloading, setReloading] = useState(false);

  // Global search & preloaded assets data states
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetMovements, setAssetMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const loadAllAssetsForSearch = async () => {
    try {
      const list = await api.getAssets();
      setAllAssets(list || []);
    } catch (err) {
      console.error("Failed to pre-cache assets for global search:", err);
    }
  };

  useEffect(() => {
    loadAllAssetsForSearch();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tgh_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tgh_dark_mode", "false");
    }
  }, [darkMode]);

  const fetchDbStatus = async () => {
    try {
      setDbLoading(true);
      const status = await api.getDbStatus();
      setDbStatus(status);
    } catch (err) {
      console.error("Failed to fetch DB status:", err);
      setDbStatus({ mongoConnected: false, dbName: "N/A", readyState: 0 });
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "Admin" || user.role === "SuperAdmin")) {
      fetchDbStatus();
    }
  }, [user]);

  const handleResetDatabase = async () => {
    const confirmed = window.confirm(
      "WARNING: This will permanently delete ALL master and transactional data from MongoDB. This action cannot be undone.\n\nAre you sure you want to continue?"
    );
    if (!confirmed) return;

    try {
      setResettingDb(true);
      const result = await api.resetDatabase();
      alert(result.message);
      await fetchDbStatus();
    } catch (err: any) {
      alert("Failed to reset database: " + err.message);
    } finally {
      setResettingDb(false);
    }
  };

  const triggerLiveReload = () => {
    setReloading(true);
    loadAllAssetsForSearch();
    setTimeout(() => {
      setReloading(false);
    }, 850);
  };

  // Detailed spotlight selection & fetching relocation historical flight logs
  const handleSelectAsset = async (asset: Asset) => {
    setSelectedAsset(asset);
    setSearchQuery(""); // close suggestions
    setLoadingMovements(true);
    try {
      const movements = await api.getAssetMovements(asset.assetId);
      setAssetMovements(movements || []);
    } catch (err) {
      console.error("Failed to retrieve asset movements:", err);
      setAssetMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "sidebar-btn-dash" },
    { path: "/assets", label: "Asset Register", icon: FileSearch, id: "sidebar-btn-assets" },
    { path: "/masters", label: "Configuration", icon: Layers, id: "sidebar-btn-masters" },
    ...((user.role === "Admin" || user.role === "SuperAdmin") ? [{ path: "/import", label: "Bulk Import", icon: UploadCloud, id: "sidebar-btn-import" }] : []),
    ...((user.role === "Admin" || user.role === "SuperAdmin") ? [{ path: "/users", label: "User Management", icon: UserCog, id: "sidebar-btn-users" }] : []),
    { path: "/reports", label: "Reports", icon: Settings, id: "sidebar-btn-reports" },
  ];

  return (
    <div id="authorized-app-layout" className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col font-sans select-none selection:bg-teal-500 selection:text-white">

      {/* Top Corporate Status Header Bar */}
      <header id="corporate-header" className="z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 px-6 py-3.5 flex items-center justify-between shadow-sm">

        {/* Left Branding metadata */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 flex items-center justify-center shadow-md shadow-teal-500/10">
            <Laptop className="h-full w-full text-white stroke-[2.2]" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5 leading-none">
              TGH Asset Hub
            </h1>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wide mt-1 block">ENT SYSTEM V2.4</span>
          </div>
        </div>

        {/* Dynamic Global search bar */}
        <div className="relative flex-1 max-w-sm sm:max-w-md mx-4" id="global-search-container">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search Asset ID, Spec name, Serial SN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-150/60 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 rounded-xl pl-9 pr-8 py-2 focus:outline-none transition-all duration-150 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Search Dropdown overlay */}
          {searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1.5">
              {allAssets.filter((a) => {
                const q = searchQuery.toLowerCase();
                const equipmentName = typeof a.equipment === "string" ? a.equipment : a.equipment?.equipmentName || a.equipmentName || "";
                const departmentName = typeof a.department === "string" ? a.department : a.department?.departmentName || "";
                return (
                  String(a.assetId || "").toLowerCase().includes(q) ||
                  String(a.oemSerialNumber || "").toLowerCase().includes(q) ||
                  String(equipmentName).toLowerCase().includes(q) ||
                  String(a.assignedEmployee?.employeeName || "").toLowerCase().includes(q) ||
                  String(departmentName).toLowerCase().includes(q)
                );
              }).length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">No matching assets found</div>
              ) : (
                allAssets
                  .filter((a) => {
                    const q = searchQuery.toLowerCase();
                    const equipmentName = typeof a.equipment === "string" ? a.equipment : a.equipment?.equipmentName || a.equipmentName || "";
                    const departmentName = typeof a.department === "string" ? a.department : a.department?.departmentName || "";
                    return (
                      String(a.assetId || "").toLowerCase().includes(q) ||
                      String(a.oemSerialNumber || "").toLowerCase().includes(q) ||
                      String(equipmentName).toLowerCase().includes(q) ||
                      String(a.assignedEmployee?.employeeName || "").toLowerCase().includes(q) ||
                      String(departmentName).toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 10)
                  .map((asset) => {
                    const equipmentLabel = typeof asset.equipment === "string" ? asset.equipment : asset.equipment?.equipmentName || asset.equipmentName || "Hardware Device";
                    const departmentLabel = typeof asset.department === "string" ? asset.department : asset.department?.departmentCode || "Store";
                    return (
                      <button
                        key={asset._id || asset.assetId}
                        onClick={() => handleSelectAsset(asset)}
                        className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between text-xs transition duration-150 group"
                      >
                        <div className="space-y-0.5 pr-2 truncate">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-teal-600 group-hover:text-teal-700">{asset.assetId}</span>
                            <span className="text-slate-350">•</span>
                            <span className="text-slate-850 font-bold truncate max-w-[140px]">
                              {equipmentLabel}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-450 font-mono truncate">
                            SN: {asset.oemSerialNumber || "None"} | Dept: {departmentLabel}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider font-mono uppercase shrink-0 border ${asset.status === "Active" ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400" :
                          asset.status === "Spare" ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400" :
                            asset.status === "Under Repair" ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400" :
                              "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                          }`}>
                          {asset.status}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          )}
        </div>

        {/* Right Session management */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* MongoDB Connection Indicator */}
          {(user.role === "Admin" || user.role === "SuperAdmin") && dbStatus && (
            <div
              id="db-status-indicator"
              title={`MongoDB: ${dbStatus.mongoConnected ? "Connected" : "Disconnected"} | DB: ${dbStatus.dbName}`}
              onClick={fetchDbStatus}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              <div className={`h-2 w-2 rounded-full ${dbStatus.mongoConnected ? "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-rose-500 dark:bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.5)]"}`} />
              <span className={darkMode ? "text-slate-400" : "text-slate-600"}>{dbLoading ? "Chk" : dbStatus.mongoConnected ? "Mongo" : "NoDB"}</span>
            </div>
          )}

          {/* Dark/Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={() => setDarkMode((prev) => !prev)}
            className={`p-2 rounded-xl border transition duration-150 cursor-pointer ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
            title="Toggle dark/light mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Synchronizer Loader */}
          <button
            id="global-sync-btn"
            onClick={triggerLiveReload}
            className="p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs transition duration-150 flex items-center gap-1.5"
            title="Reload live inventory"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reloading ? "animate-spin text-teal-500" : "text-slate-400"}`} />
            <span className="font-mono text-[9px] uppercase tracking-wider hidden md:inline">Sync Archives</span>
          </button>

          {/* User badge */}
          <div id="user-badge" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="h-5 w-5 rounded-full bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center">
              <UserCheck className="h-3 w-3 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-left leading-none">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">{user.name}</span>
              <span className={`text-[8px] font-mono font-black uppercase inline-block mt-0.5 ${user.role === "Admin" ? "text-teal-600 dark:text-teal-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                {user.role}
              </span>
            </div>
          </div>

          <button
            id="disconnect-session-btn"
            onClick={onLogout}
            className="p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 text-rose-500 dark:text-rose-400 hover:text-white rounded-xl border border-rose-200 dark:border-rose-800 hover:border-transparent transition-all duration-150 cursor-pointer"
            title="Log Out Session"
          >
            <LogOut className="h-4 w-4" />
          </button>

        </div>

      </header>

      {/* Corporate Dashboard Shell (Sidebar + Main stage view) */}
      <div id="dashboard-system-shell" className="flex-1 flex flex-col md:flex-row">

        {/* Navigation Sidebar Drawer */}
        <nav id="system-sidebar" className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-7 flex flex-col justify-between shadow-sm">

          <div className="space-y-6">
            <div className="px-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Workspace Operations</span>
            </div>

            <div id="sidebar-nav-actions" className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  id={item.id}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                    isActive(item.path)
                      ? "bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Core Screen Stage */}
        <main id="active-screen-stage" className="flex-1 p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          {reloading ? (
            <div id="live-synchronize-screen-loader" className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500 dark:text-slate-400 text-xs font-mono animate-pulse">
              <RefreshCw className="h-8 w-8 text-teal-500 animate-spin" />
              <span>Loading dashboard...</span>
            </div>
          ) : (
            <Outlet context={{ user, token, triggerLiveReload }} />
          )}
        </main>

      </div>

      {/* Global Bottom Margin Footer */}
      <footer id="main-application-footer" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono">
        <span>TGH Corporation • ALL RIGHTS RESERVED © 2026</span>
        <span className="mt-1 sm:mt-0 font-bold text-[10px] text-teal-600">SECURITY PROTOCOL: TLS-256 • REALTIME COMPLIANCE</span>
      </footer>

      {/* Interactive Global Spotlight Asset Modal popup */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans select-none overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-6 relative max-h-[85vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 font-bold font-mono text-[11px] tracking-wider uppercase">Asset Record</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold tracking-wider uppercase border ${selectedAsset.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                    selectedAsset.status === "Spare" ? "bg-amber-50 border-amber-200 text-amber-700" :
                      selectedAsset.status === "Under Repair" ? "bg-rose-50 border-rose-200 text-rose-700" :
                        "bg-slate-50 border-slate-200 text-slate-705"
                    }`}>
                    {selectedAsset.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                  {(typeof selectedAsset.equipment === "string" ? selectedAsset.equipment : selectedAsset.equipment?.equipmentName) || "Hardware Device"}
                </h3>
                <p className="text-slate-450 mt-1 font-mono text-[11px]">
                  Asset ID: <span className="font-bold text-slate-700">{selectedAsset.assetId}</span> • OEM SN: {selectedAsset.oemSerialNumber || "—"}
                </p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 px-3.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 font-bold transition duration-150"
              >
                ×
              </button>
            </div>

            {/* Grid Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700 p-3.5 rounded-xl space-y-2.5">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-mono">Location & Custody Info</h4>
                <div className="space-y-2 font-sans text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-450 dark:text-slate-500 flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> Department:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(typeof selectedAsset.department === 'object' ? selectedAsset.department?.departmentName : selectedAsset.department) || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-415 dark:text-slate-500 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location Site:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(typeof selectedAsset.location === 'object' ? selectedAsset.location?.locationName : selectedAsset.location) || "Warehouse Store"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-415 dark:text-slate-500 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Custodian:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(typeof selectedAsset.assignedEmployee === 'object' ? selectedAsset.assignedEmployee?.employeeName : selectedAsset.assignedEmployee) || "Unassigned HQ"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700 p-3.5 rounded-xl space-y-2.5">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-mono">Specs Metadata</h4>
                <div className="space-y-2 font-mono text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-450 dark:text-slate-500">Spec Code:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(typeof selectedAsset.equipment === 'object' && selectedAsset.equipment?.equipmentCode) || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-450 dark:text-slate-500">Category:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{typeof selectedAsset.equipment === 'object' ? (selectedAsset.equipment?.category || 'Equipment') : (selectedAsset.equipment || 'Equipment')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-450 dark:text-slate-500">Created At:</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedAsset.createdAt ? new Date(selectedAsset.createdAt).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Relocation history logs */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600" />
                <span>Movements Transit Flights Log</span>
              </h4>

              {loadingMovements ? (
                <div className="py-6 text-center text-xs text-slate-400 font-mono animate-pulse">Querying relational relocation layers...</div>
              ) : assetMovements.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  No historical relocation logs recorded for this asset ledger.
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700 rounded-xl divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden text-xs max-h-40 overflow-y-auto">
                  {assetMovements.map((m, idx) => (
                    <div key={m._id || idx} className="p-3 space-y-1 hover:bg-slate-100/50 transition duration-100">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-450">
                        <span className="text-teal-600 font-bold">{m.movementId}</span>
                        <span>{new Date(m.transferDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-700">
                        <div>
                          <span className="text-slate-400">Assigned:</span> <span className="font-semibold text-slate-800">{m.toEmployee?.employeeName || "Warehouse Store"}</span>
                          {m.toLocation?.locationName && (
                            <>
                              <span className="text-slate-400"> at </span>
                              <span className="font-semibold text-slate-800">{m.toLocation?.locationName}</span>
                            </>
                          )}
                        </div>
                        {m.remarks && <span className="text-[10px] text-slate-500 italic font-mono truncate max-w-xs">&ldquo;{m.remarks}&rdquo;</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center border-t border-slate-150 pt-4 mt-6">
              <button
                onClick={() => {
                  navigate("/assets");
                  setSelectedAsset(null);
                }}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer"
              >
                Go to Operational Registry
              </button>
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 bg-teal-500 hover:opacity-95 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-teal-500/10 cursor-pointer"
              >
                Close Spotlight
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { DashboardStats, ChartDataGroup, RecentActivities } from "../types";
import {
  Building, MapPin, Layers, History,
  TrendingUp, HardDrive, CheckCircle, AlertTriangle, Trash2, Calendar, Copy
} from "lucide-react";

export default function DashboardView() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartDataGroup | null>(null);
  const [activities, setActivities] = useState<RecentActivities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, chartsRes, actRes] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardCharts(),
        api.getDashboardActivities()
      ]);
      setStats(statsRes);
      setCharts(chartsRes);
      setActivities(actRes);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div id="dashboard-loading" className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
        <span className="h-8 w-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-mono">Aggregating live asset metrics across locations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div id="dashboard-error" className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl max-w-2xl mx-auto my-10 text-center animate-fadeIn">
        <span className="inline-block p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mb-3 text-xl">!</span>
        <h3 className="text-slate-800 dark:text-slate-200 font-bold">Error Loading Metrics</h3>
        <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const defaultStats = stats || { totalAssets: 0, activeAssets: 0, spareAssets: 0, repairAssets: 0, scrapAssets: 0 };
  const total = defaultStats.totalAssets || 1;

  const statCards = [
    {
      id: "stats-total",
      label: "Total Registered",
      value: defaultStats.totalAssets,
      icon: HardDrive,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200/60 dark:border-blue-800/40",
      pct: "100%",
    },
    {
      id: "stats-active",
      label: "Active Deployments",
      value: defaultStats.activeAssets,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200/60 dark:border-emerald-800/40",
      pct: `${Math.round((defaultStats.activeAssets / total) * 100)}%`,
    },
    {
      id: "stats-spare",
      label: "Spare in Store",
      value: defaultStats.spareAssets,
      icon: Layers,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200/60 dark:border-amber-800/40",
      pct: `${Math.round((defaultStats.spareAssets / total) * 100)}%`,
    },
    {
      id: "stats-repair",
      label: "Under Repair",
      value: defaultStats.repairAssets,
      icon: AlertTriangle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200/60 dark:border-rose-800/40",
      pct: `${Math.round((defaultStats.repairAssets / total) * 100)}%`,
    },
    {
      id: "stats-scrap",
      label: "Scrapped Assets",
      value: defaultStats.scrapAssets,
      icon: Trash2,
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-100 dark:bg-slate-800/60",
      border: "border-slate-300/60 dark:border-slate-700/60",
      pct: `${Math.round((defaultStats.scrapAssets / total) * 100)}%`,
    }
  ];

  const deptsSorted = charts?.departmentWise ? [...charts.departmentWise].sort((a, b) => b.value - a.value) : [];
  const locsSorted = charts?.locationWise ? [...charts.locationWise].sort((a, b) => b.value - a.value) : [];
  const catsSorted = charts?.categoryWise ? [...charts.categoryWise].sort((a, b) => b.value - a.value) : [];

  const maxDeptValue = Math.max(...deptsSorted.map(d => d.value), 1);
  const maxLocValue = Math.max(...locsSorted.map(l => l.value), 1);
  const maxCatValue = Math.max(...catsSorted.map(c => c.value), 1);

  const barColors = [
    "from-teal-500 to-emerald-400 dark:from-teal-400 dark:to-emerald-500",
    "from-teal-400 to-indigo-500 dark:from-indigo-400 dark:to-teal-500",
    "from-indigo-500 to-purple-400 dark:from-purple-400 dark:to-indigo-500",
  ];

  return (
    <div id="dashboard-view-root" className="space-y-8 font-sans">

      {/* KPI Cards */}
      <div id="stats-grid" className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              id={card.id}
              key={card.id}
              className={`${card.bg} ${card.border} border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 ${card.color}`}>
                  <IconComponent className="h-4 w-4 stroke-[2]" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-sans">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution Cards */}
      <div id="dashboard-distributions" className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {[
          { title: "Department Allocation", icon: Building, iconColor: "text-teal-600 dark:text-teal-400", data: deptsSorted, maxVal: maxDeptValue, total, barColor: barColors[0], btn: "Manage Departments", tab: "masters" as const },
          { title: "Location Deployments", icon: MapPin, iconColor: "text-emerald-600 dark:text-emerald-400", data: locsSorted, maxVal: maxLocValue, total, barColor: barColors[1], btn: "Manage Locations", tab: "masters" as const },
          { title: "Asset Category Mix", icon: Layers, iconColor: "text-indigo-600 dark:text-indigo-400", data: catsSorted, maxVal: maxCatValue, total, barColor: barColors[2], btn: "Manage Equipment", tab: "masters" as const },
        ].map((section) => (
          <div key={section.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <section.icon className={`h-4 w-4 ${section.iconColor}`} />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{section.title}</h3>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Live</span>
              </div>

              {section.data.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-10 text-center italic">No data available.</p>
              ) : (
                <div className="space-y-3">
                  {section.data.map((item: any, index: number) => {
                    const percentage = Math.round((item.value / section.maxVal) * 100);
                    const totalPercent = Math.round((item.value / section.total) * 100);
                    return (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                            {item.value} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">({totalPercent}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${section.barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(`/${section.tab}`)}
              className="w-full mt-5 py-2 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 rounded-lg transition cursor-pointer text-center"
            >
              {section.btn}
            </button>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div id="recent-activities-panel" className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Registrations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 transition-all duration-200 hover:shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recent Registrations</h3>
          </div>

          {activities?.recentAssets && activities.recentAssets.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[340px] overflow-y-auto pr-1">
              {activities.recentAssets.map((asset, idx) => (
                <div key={asset._id || idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                          {asset.assetId}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(asset.assetId).then(() => {})}
                          className="text-slate-400 hover:text-teal-600 transition"
                          title="Copy Asset ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[150px]">
                        {asset.equipmentName || "Equipment"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                      <span>Dept: {asset.departmentCode || "N/A"}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>SN: {asset.oemSerialNumber || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${asset.status === "Active" ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400" :
                      asset.status === "Spare" ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400" :
                        asset.status === "Under Repair" ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400" :
                          "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      }`}>
                      {asset.status}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 italic">
              No recent assets.
            </div>
          )}
        </div>

        {/* Recent Relocations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 transition-all duration-200 hover:shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recent Relocations</h3>
          </div>

          {activities?.recentTransfers && activities.recentTransfers.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[340px] overflow-y-auto pr-1">
              {activities.recentTransfers.map((m, idx) => (
                <div key={m._id || idx} className="py-3 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{m.movementId || "M-ID"}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">Asset: {m.assetId}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {new Date(m.transferDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-700/60">
                    <div className="flex-1 truncate">
                      <span className="text-slate-400 dark:text-slate-500 block uppercase text-[8px] tracking-wider mb-0.5 font-bold">Assigned To</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        {m.toEmployee ? (m.toEmployee as any).employeeName : "Store/Warehouse"}
                        {m.toEmployee && (
                          <button
                            onClick={() => navigator.clipboard.writeText((m.toEmployee as any).employeeName).then(() => {})}
                            className="text-slate-400 hover:text-teal-600 transition"
                            title="Copy Employee Name"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 truncate">
                      <span className="text-slate-400 dark:text-slate-500 block uppercase text-[8px] tracking-wider mb-0.5 font-bold">Location</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {m.toLocation ? m.toLocation.locationName : "N/A"}
                      </span>
                    </div>
                  </div>

                  {m.remarks && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pl-1 truncate">
                      &ldquo;{m.remarks}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 italic">
              No recent relocations.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
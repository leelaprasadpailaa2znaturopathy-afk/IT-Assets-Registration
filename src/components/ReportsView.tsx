import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { User } from "../types";
import { 
  FileText, Download, CheckCircle, ShieldAlert, History, 
  MapPin, Building, Users, Search, Activity, RotateCcw, Filter, Copy
} from "lucide-react";

interface ReportsViewProps {
  currentUser: User | null;
}

type ReportType = "register" | "department" | "employee" | "location" | "movements";

export default function ReportsView({ currentUser }: ReportsViewProps) {
  const [reportType, setReportType] = useState<ReportType>("register");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReportsData(reportType);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve compiled ledger registers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    setSearchQuery("");
    setStatusFilter("All");
  }, [reportType]);

  const handleDownload = () => {
    const url = api.getExportCsvUrl(reportType);
    // Create an anchor node to trigger download natively
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tgh-${reportType}-report.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  // Live filter computation
  const filteredData = data.filter((item) => {
    // 1. Filter by status if not "All" (ignored for movements)
    if (reportType !== "movements" && statusFilter !== "All") {
      if (item.status !== statusFilter) return false;
    }

    // 2. Filter by search query
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    if (reportType === "movements") {
      const mId = String(item.movementId || "").toLowerCase();
      const aId = String(item.assetId || "").toLowerCase();
      const fromEmp = String(item.fromEmployee?.employeeName || "").toLowerCase();
      const toEmp = String(item.toEmployee?.employeeName || "").toLowerCase();
      const remarks = String(item.remarks || "").toLowerCase();
      return (
        mId.includes(query) ||
        aId.includes(query) ||
        fromEmp.includes(query) ||
        toEmp.includes(query) ||
        remarks.includes(query)
      );
    } else {
      const aId = String(item.assetId || "").toLowerCase();
      const model = String(item.equipment?.equipmentName || item.equipmentName || "").toLowerCase();
      const dept = String(item.department?.departmentName || "").toLowerCase();
      const custodian = String(item.assignedEmployee?.employeeName || "").toLowerCase();
      const loc = String(item.location?.locationName || "").toLowerCase();
      const serial = String(item.oemSerialNumber || "").toLowerCase();
      return (
        aId.includes(query) ||
        model.includes(query) ||
        dept.includes(query) ||
        custodian.includes(query) ||
        loc.includes(query) ||
        serial.includes(query)
      );
    }
  });

  // Dynamic ledger aggregates
  const totalCount = data.length;
  const activeCount = reportType === "movements" ? 0 : data.filter((a) => a.status === "Active").length;
  const spareCount = reportType === "movements" ? 0 : data.filter((a) => a.status === "Spare").length;
  const repairCount = reportType === "movements" ? 0 : data.filter((a) => a.status === "Under Repair").length;

  return (
    <div id="reports-view-root" className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-205 pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-1">Corporate Ledger Reporting & CSV Export</h2>
          <p className="text-xs text-slate-500">Compile, group, and query assets inventories with certified compliance worksheets</p>
        </div>

        <button
          id="export-csv-btn"
          type="button"
          onClick={handleDownload}
          disabled={loading || data.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 hover:opacity-95 bg-gradient-to-r from-teal-605 to-emerald-600 font-bold text-white text-xs rounded-xl shadow-lg shadow-teal-500/10 cursor-pointer disabled:opacity-40 transition-all duration-150"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Workbook</span>
        </button>
      </div>

      {/* Selector layout of Reports */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5" id="reports-type-selectors">
        
        {/* Type 1: Register */}
        <button
          onClick={() => setReportType("register")}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
            reportType === "register" 
              ? "bg-white border-2 border-teal-500 text-teal-600 shadow-sm" 
              : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-850 hover:bg-slate-100/50"
          }`}
        >
          <FileText className="h-5 w-5 mb-3 text-teal-600" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-0.5">Inventory Registry</h4>
            <span className="text-[10px] text-slate-400 block font-mono font-bold">ALL ASSETS</span>
          </div>
        </button>

        {/* Type 2: Department */}
        <button
          onClick={() => setReportType("department")}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
            reportType === "department" 
              ? "bg-white border-2 border-teal-500 text-teal-600 shadow-sm" 
              : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-850 hover:bg-slate-100/50"
          }`}
        >
          <Building className="h-5 w-5 mb-3 text-indigo-500" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-0.5">Section Ledger</h4>
            <span className="text-[10px] text-slate-400 block font-mono font-bold">SORTED BY DEPT</span>
          </div>
        </button>

        {/* Type 3: Employee */}
        <button
          onClick={() => setReportType("employee")}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
            reportType === "employee" 
              ? "bg-white border-2 border-teal-500 text-teal-600 shadow-sm" 
              : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-850 hover:bg-slate-100/50"
          }`}
        >
          <Users className="h-5 w-5 mb-3 text-emerald-500" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-0.5">Custody Records</h4>
            <span className="text-[10px] text-slate-400 block font-mono font-bold">ASSIGNED SYSTEMS</span>
          </div>
        </button>

        {/* Type 4: Location */}
        <button
          onClick={() => setReportType("location")}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
            reportType === "location" 
              ? "bg-white border-2 border-teal-500 text-teal-600 shadow-sm" 
              : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-850 hover:bg-slate-100/50"
          }`}
        >
          <MapPin className="h-5 w-5 mb-3 text-rose-500" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-0.5">Site Breakdowns</h4>
            <span className="text-[10px] text-slate-400 block font-mono font-bold">BY BUILDING SITE</span>
          </div>
        </button>

        {/* Type 5: Movement */}
        <button
          onClick={() => setReportType("movements")}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between col-span-2 md:col-span-1 ${
            reportType === "movements" 
              ? "bg-white border-2 border-teal-500 text-teal-600 shadow-sm" 
              : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-850 hover:bg-slate-100/50"
          }`}
        >
          <History className="h-5 w-5 mb-3 text-teal-500" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-0.5">Relocation History</h4>
            <span className="text-[10px] text-slate-400 block font-mono font-bold">TRANSFER FLIGHTS</span>
          </div>
        </button>

      </div>

      {/* Aggregate metrics review summary blocks */}
      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" id="reports-ledger-summary-banner">
          
          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-slate-50 text-teal-600 rounded-lg border border-slate-150">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-450 font-mono block uppercase">Ledger Records</span>
              <span className="text-sm font-bold text-slate-800 font-mono">{totalCount} units</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-slate-50 text-emerald-600 rounded-lg border border-slate-150">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-455 font-mono block uppercase">Active Operation</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {reportType === "movements" ? "—" : `${activeCount} units`}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-slate-50 text-amber-600 rounded-lg border border-slate-150">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-455 font-mono block uppercase">Standby Reservoir</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {reportType === "movements" ? "—" : `${spareCount} units`}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-slate-50 text-rose-600 rounded-lg border border-slate-150">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-455 font-mono block uppercase">Under Repair</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {reportType === "movements" ? "—" : `${repairCount} units`}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Logs Preview container block */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 gap-3 text-slate-500 text-xs font-mono shadow-sm">
          <span className="h-6 w-6 border-2 border-teal-550 border-t-transparent rounded-full animate-spin" />
          <span>Formulating preview registers...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-650 font-semibold shadow-sm">
          <ShieldAlert className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <p className="text-xs font-mono">{error}</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Real-time search tools and status filter parameters */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {reportType === "movements" ? "Audit Log Relocations List" : "Corporate Inventory Worksheet"}
              </span>
              <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-650 shadow-sm font-bold">
                Found {filteredData.length} records
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              
              {/* Filter Status (Only for non-movements) */}
              {reportType !== "movements" && (
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-sm">
                  <Filter className="h-3 w-3 text-slate-400 mr-2" />
                  <select
                    aria-label="Filter Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="All" className="bg-white text-slate-700">All Statuses</option>
                    <option value="Active" className="bg-white text-slate-700">Active</option>
                    <option value="Spare" className="bg-white text-slate-700">Spare</option>
                    <option value="Under Repair" className="bg-white text-slate-700">Under Repair</option>
                  </select>
                </div>
              )}

              {/* Search query field */}
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={reportType === "movements" ? "Search ID, Asset, remarks..." : "Search spec, custodian, department..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-slate-400 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-800 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Reset view triggers */}
              {(searchQuery || statusFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("All");
                  }}
                  className="text-xs text-teal-605 hover:text-teal-700 flex items-center justify-center gap-1.5 px-2 py-1 duration-150 font-bold"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}

            </div>
          </div>

          <div className="overflow-x-auto">
            
            {/* MOVEMENT REPORT DISPLAY */}
            {reportType === "movements" ? (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Movement ID</th>
                    <th className="px-6 py-3.5">Asset Code</th>
                    <th className="px-6 py-3.5">Custodian Relocation source</th>
                    <th className="px-6 py-3.5">Destination target</th>
                    <th className="px-6 py-3.5">Remarks / Reason</th>
                    <th className="px-6 py-3.5">Approved Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-sans">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No movements audit records log.</td>
                    </tr>
                  ) : (
                    filteredData.map((m, idx) => (
                      <tr key={m._id || idx} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-3.5 font-mono text-teal-600 font-bold">
                          <div className="flex items-center gap-1">
                            {m.movementId}
                            <button
                              onClick={() => navigator.clipboard.writeText(m.movementId).then(() => {})}
                              className="text-slate-400 hover:text-teal-600 transition"
                              title="Copy Movement ID"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-bold font-mono text-slate-800">
                          <div className="flex items-center gap-1">
                            {m.assetId}
                            <button
                              onClick={() => navigator.clipboard.writeText(m.assetId).then(() => {})}
                              className="text-slate-400 hover:text-teal-600 transition"
                              title="Copy Asset ID"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          <div className="flex items-center gap-1">
                            {m.fromEmployee ? m.fromEmployee.employeeName : "Store/HQ Warehouse"}
                            {m.fromEmployee && (
                              <button
                                onClick={() => navigator.clipboard.writeText(m.fromEmployee.employeeName).then(() => {})}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Source Employee"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-800 font-medium">
                          <div className="flex items-center gap-1">
                            {m.toEmployee ? m.toEmployee.employeeName : "HQ Store"}
                            {m.toEmployee && (
                              <button
                                onClick={() => navigator.clipboard.writeText(m.toEmployee.employeeName).then(() => {})}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Destination Employee"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-550 italic max-w-xs truncate" title={m.remarks}>
                          &ldquo;{m.remarks || "—"}&rdquo;
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-450">
                          {new Date(m.transferDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              // ASSETS / DEPT / EMP / LOC REPORT DISPLAY
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Asset ID</th>
                    <th className="px-6 py-3.5">Model Specification Name</th>
                    <th className="px-6 py-3.5">Affiliated Department</th>
                    <th className="px-6 py-3.5">Current Custodian</th>
                    <th className="px-6 py-3.5">Deploy Location</th>
                    <th className="px-6 py-3.5">Device Serial</th>
                    <th className="px-6 py-3.5">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-sans">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">Worksheet is vacant.</td>
                    </tr>
                  ) : (
                    filteredData.map((a, idx) => (
                      <tr key={a._id || idx} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-3.5 font-mono text-teal-600 font-bold">
                          <div className="flex items-center gap-1">
                            {a.assetId}
                            <button
                              onClick={() => navigator.clipboard.writeText(a.assetId).then(() => {})}
                              className="text-slate-400 hover:text-teal-600 transition"
                              title="Copy Asset ID"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-800">
                          <div className="flex items-center gap-1">
                            {a.equipment ? a.equipment.equipmentName : (a.equipmentName || "Hardware Spec")}
                            {a.equipment?.equipmentName && (
                              <button
                                onClick={() => navigator.clipboard.writeText(a.equipment.equipmentName).then(() => {})}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Equipment Name"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-705 font-semibold">
                          <div className="flex items-center gap-1">
                            {a.department ? a.department.departmentName : "IndependentHQ"}
                            {a.department && (
                              <button
                                onClick={() => navigator.clipboard.writeText(a.department.departmentName).then(() => {})}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Department"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          <div className="flex items-center gap-1">
                            {a.assignedEmployee ? a.assignedEmployee.employeeName : (
                              <span className="text-slate-400 italic">Spare / Central Store</span>
                            )}
                            {a.assignedEmployee && (
                              <button
                                onClick={() => navigator.clipboard.writeText(a.assignedEmployee.employeeName).then(() => {})}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Employee Name"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          <div className="flex items-center gap-1">
                            {a.location ? a.location.locationName : "Main Logistics Warehouse"}
                            {a.location && (
                              <button
                                onClick={() => navigator.clipboard.writeText(a.location.locationName).then(() => {})}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Location"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">
                          <div className="flex items-center gap-1">
                            {a.oemSerialNumber || "—"}
                            {a.oemSerialNumber && (
                              <button
                                onClick={() => navigator.clipboard.writeText(a.oemSerialNumber).then(() => {})}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Serial Number"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            a.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                            a.status === "Spare" ? "bg-amber-50 border-amber-250 text-amber-700" :
                            a.status === "Under Repair" ? "bg-rose-50 border-rose-200 text-rose-700" :
                            "bg-slate-50 border-slate-205 text-slate-500"
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
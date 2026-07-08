import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { Asset, Department, EquipmentMaster, Location, Employee, User } from "../types";
import { 
  Search, Filter, Plus, Eye, ArrowLeftRight, Edit, CheckCircle, 
  AlertTriangle, Trash2, ShieldCheck, X, FileText, UserPlus, ShieldAlert, Download, Copy
} from "lucide-react";

interface AssetsViewProps {
  currentUser: User | null;
}

export default function AssetsView({ currentUser }: AssetsViewProps) {
  const isAdmin = ["Admin", "SuperAdmin", "Super Admin"].includes(currentUser?.role || "");

  // Raw states
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [equipment, setEquipment] = useState<EquipmentMaster[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [locFilter, setLocFilter] = useState("ALL");

  // Selection state for download
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

  // Loading / Messages status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active Modals state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [movementsHistory, setMovementsHistory] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  // Transfer form state
  const [transferToEmployeeId, setTransferToEmployeeId] = useState("");
  const [transferToLocationId, setTransferToLocationId] = useState("");
  const [transferRemarks, setTransferRemarks] = useState("");

  // Register Asset Form state
  const [formEquipmentId, setFormEquipmentId] = useState("");
  const [formDepartmentId, setFormDepartmentId] = useState("");
  const [formLocationId, setFormLocationId] = useState("");
  const [formAssignedEmployeeId, setFormAssignedEmployeeId] = useState("");
  const [formOemSerial, setFormOemSerial] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Spare" | "Under Repair" | "Scrap">("Spare");
  const [formTechnician, setFormTechnician] = useState("");
  const [formMaintenanceTeam, setFormMaintenanceTeam] = useState("");
  const [formWorkCenter, setFormWorkCenter] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetsRes, deptsRes, eqRes, locsRes, empRes] = await Promise.all([
        api.getAssets(),
        api.getDepartments(),
        api.getEquipment(),
        api.getLocations(),
        api.getEmployees()
      ]);
      setAssets(assetsRes);
      setDepartments(deptsRes.filter(d => !d.isDeleted));
      setEquipment(eqRes.filter(e => e.activeStatus !== false));
      setLocations(locsRes);
      setEmployees(empRes.filter(e => e.status === "Active"));
    } catch (err: any) {
      setError(err.message || "Failed to align asset memory lists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  // Perform filtering calculations
  const filteredAssets = assets.filter((asset) => {
    // 1. Text Search
    const q = searchQuery.toLowerCase().trim();
    const assetIdOk = asset.assetId.toLowerCase().includes(q);
    const eqNameOk = (asset.equipmentName || "").toLowerCase().includes(q);
    const serialOk = (asset.oemSerialNumber || "").toLowerCase().includes(q);
    const textMatches = assetIdOk || eqNameOk || serialOk;

    // 2. Status Filter
    const statusMatches = statusFilter === "ALL" || asset.status === statusFilter;

    // 3. Dept Filter
    let deptId = "";
    if (asset.department) {
      deptId = typeof asset.department === "object" ? asset.department._id : asset.department;
    }
    const deptMatches = deptFilter === "ALL" || deptId === deptFilter || asset.departmentCode === deptFilter;

    // 4. Loc Filter
    let locId = "";
    if (asset.location) {
      locId = typeof asset.location === "object" ? asset.location._id : asset.location;
    }
    const locMatches = locFilter === "ALL" || locId === locFilter;

    return textMatches && statusMatches && deptMatches && locMatches;
  });

  // Compute sequential numbering per equipment type (only shown for admin users)
  const equipmentSequenceMap = new Map<string, number>();
  const assetWithSeqNo = filteredAssets.map((asset) => {
    const eqKey = asset.equipmentName || "Other";
    if (!equipmentSequenceMap.has(eqKey)) {
      equipmentSequenceMap.set(eqKey, 0);
    }
    const seq = equipmentSequenceMap.get(eqKey)! + 1;
    equipmentSequenceMap.set(eqKey, seq);
    return { ...asset, _seqNo: seq };
  });

  // Use the sequenced array for rendering when admin, otherwise use filteredAssets
  const tableData = isAdmin ? assetWithSeqNo : filteredAssets;
  const showSeqNoColumn = isAdmin;
  const colSpanCount = showSeqNoColumn ? 10 : 9;

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      triggerSuccess(`${label} copied to clipboard`);
    }).catch(() => {
      setError(`Failed to copy ${label.toLowerCase()}`);
    });
  };

  // CSV Download helper
  const downloadAssetsCSV = (assetsToDownload: Asset[]) => {
    if (assetsToDownload.length === 0) {
      setError("No assets selected for download");
      return;
    }

    const headers = [
      "Asset ID", "Equipment Name", "Department", "Department Code", 
      "Assigned Employee", "Employee ID", "Location", "Location Code", 
      "OEM Serial Number", "Status", "Technician", "Maintenance Team", 
      "Work Center", "Remarks"
    ];

    const rows = assetsToDownload.map(asset => [
      asset.assetId || "",
      asset.equipmentName || "",
      typeof asset.department === "object" ? (asset.department as any).departmentName : "",
      asset.departmentCode || "",
      typeof asset.assignedEmployee === "object" ? (asset.assignedEmployee as any).employeeName : "",
      typeof asset.assignedEmployee === "object" ? (asset.assignedEmployee as any).employeeId : "",
      typeof asset.location === "object" ? (asset.location as any).locationName : "",
      typeof asset.location === "object" ? (asset.location as any).locationCode : "",
      asset.oemSerialNumber || "",
      asset.status || "",
      asset.technician || "",
      asset.maintenanceTeam || "",
      asset.workCenter || "",
      asset.remarks || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `assets-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess(`Downloaded ${assetsToDownload.length} asset record(s)`);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedAssetIds.size === filteredAssets.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(filteredAssets.map(a => a._id)));
    }
  };

  const toggleSelectAsset = (assetId: string) => {
    const newSelected = new Set(selectedAssetIds);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssetIds(newSelected);
  };

  // Details dialog
  const handleOpenDetails = async (asset: Asset) => {
    setSelectedAsset(asset);
    setLoadingMovements(true);
    try {
      const movements = await api.getAssetMovements(asset._id);
      setMovementsHistory(movements);
    } catch {
      setMovementsHistory([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedAsset(null);
    setMovementsHistory([]);
  };

  // Transfer Dialog
  const handleOpenTransfer = (asset: Asset) => {
    setSelectedAsset(asset);
    setTransferToEmployeeId(asset.assignedEmployee ? (typeof asset.assignedEmployee === "object" ? asset.assignedEmployee._id : asset.assignedEmployee) : "");
    setTransferToLocationId(asset.location ? (typeof asset.location === "object" ? asset.location._id : asset.location) : "");
    setTransferRemarks("");
    setTransferModalOpen(true);
  };

  const handleCloseTransfer = () => {
    setTransferModalOpen(false);
    setTransferRemarks("");
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    if (!isAdmin) {
      setError("Operation restricted to administrative roles.");
      return;
    }

    try {
      await api.transferAsset(selectedAsset._id, {
        toEmployeeId: transferToEmployeeId || undefined,
        toLocationId: transferToLocationId || undefined,
        remarks: transferRemarks,
      });

      triggerSuccess(`Asset ${selectedAsset.assetId} successfully transferred.`);
      handleCloseTransfer();
      handleCloseDetails();
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed on asset transfer workflow.");
    }
  };

  // Register Asset Open helper
  const handleOpenRegister = () => {
    setEditingAsset(null);
    setFormEquipmentId("");
    setFormDepartmentId("");
    setFormLocationId("");
    setFormAssignedEmployeeId("");
    setFormOemSerial("");
    setFormStatus("Spare");
    setFormTechnician("");
    setFormMaintenanceTeam("");
    setFormWorkCenter("");
    setFormRemarks("");
    setRegisterModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormEquipmentId(typeof asset.equipment === "object" ? asset.equipment._id : asset.equipment || "");
    setFormDepartmentId(typeof asset.department === "object" ? asset.department._id : asset.department || "");
    setFormLocationId(typeof asset.location === "object" ? asset.location._id : asset.location || "");
    setFormAssignedEmployeeId(asset.assignedEmployee ? (typeof asset.assignedEmployee === "object" ? asset.assignedEmployee._id : asset.assignedEmployee) : "");
    setFormOemSerial(asset.oemSerialNumber || "");
    setFormStatus(asset.status || "Spare");
    setFormTechnician(asset.technician || "");
    setFormMaintenanceTeam(asset.maintenanceTeam || "");
    setFormWorkCenter(asset.workCenter || "");
    setFormRemarks(asset.remarks || "");
    setRegisterModalOpen(true);
  };

  const handleCloseRegister = () => {
    setRegisterModalOpen(false);
    setEditingAsset(null);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!formEquipmentId || !formDepartmentId || !formLocationId) {
      setError("Required fields: Equipment Spec, Department, Location coordinates.");
      return;
    }

    const payload: any = {
      equipmentId: formEquipmentId,
      departmentId: formDepartmentId,
      locationId: formLocationId,
      assignedEmployeeId: formAssignedEmployeeId || undefined,
      oemSerialNumber: formOemSerial,
      status: formStatus,
      technician: formTechnician,
      maintenanceTeam: formMaintenanceTeam,
      workCenter: formWorkCenter,
      remarks: formRemarks,
    };

    try {
      if (editingAsset) {
        await api.updateAsset(editingAsset._id, payload);
        triggerSuccess(`Asset ${editingAsset.assetId} specification amended.`);
      } else {
        const item = await api.createAsset(payload);
        triggerSuccess(`New Asset indexed as ${item.assetId}.`);
      }
      handleCloseRegister();
      fetchData();
    } catch (err: any) {
      setError(err.message || "Could not execute asset registration task.");
    }
  };

  // Delete Asset handler
  const handleDeleteAsset = async (asset: Asset) => {
    if (!isAdmin) return;
    
    const confirmed = window.confirm(
      `⚠️ PERMANENT DELETE WARNING\n\nYou are about to permanently delete asset:\n\n${asset.assetId} - ${asset.equipmentName || "Unknown"}\n\nThis action will also delete ALL associated movement/transfer history logs. This cannot be undone.\n\nAre you sure you want to proceed?`
    );
    if (!confirmed) return;

    try {
      await api.deleteAsset(asset._id);
      triggerSuccess(`Asset ${asset.assetId} and its history has been permanently deleted.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to delete asset.");
    }
  };

  return (
    <div id="assets-registry-root" className="space-y-6 font-sans">
      
      {/* Banner info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-800 mb-1">Asset Operational Registry</h2>
          <p className="text-xs text-slate-500">Total matched accounts: {filteredAssets.length} logs</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <button
                id="download-selected-assets-btn"
                type="button"
                onClick={() => {
                  const selectedAssets = filteredAssets.filter(a => selectedAssetIds.has(a._id));
                  downloadAssetsCSV(selectedAssets as Asset[]);
                }}
                disabled={selectedAssetIds.size === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 shadow-sm disabled:opacity-45 cursor-pointer transition"
                title={selectedAssetIds.size > 0 ? `Download ${selectedAssetIds.size} selected asset(s)` : "Select assets to download"}
              >
                <Download className="h-4 w-4" />
                <span>Download {selectedAssetIds.size > 0 && `(${selectedAssetIds.size})`}</span>
              </button>
              <button
                id="download-all-assets-btn"
                type="button"
                onClick={() => downloadAssetsCSV(filteredAssets as Asset[])}
                disabled={filteredAssets.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-605 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 disabled:opacity-45 cursor-pointer transition"
                title="Download all filtered assets as CSV"
              >
                <Download className="h-4 w-4" />
                <span>Download All</span>
              </button>
              <button
                id="register-new-asset-btn"
                type="button"
                onClick={handleOpenRegister}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-605 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Register Asset Unit</span>
              </button>
            </>
          )}
          {!isAdmin && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-455 border border-slate-200 bg-slate-50 p-2 rounded-lg">
              <span>Locked Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div id="assets-alert-success" className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium">
          ✔ {success}
        </div>
      )}

      {/* Advanced Filters */}
      <div id="filter-controls-pnl" className="bg-white border border-slate-205 rounded-xl p-4 space-y-4 shadow-sm">
        
        {/* Row 1: Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="assets-search-box"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Asset ID Code, OEM Serial Number, Model specifications..."
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Row 2: Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Status Select */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Operational Status</label>
            <select
              id="filter-asset-status"
              title="Operational Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Deployments</option>
              <option value="Spare">Spare in Store</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Scrap">Scrapped</option>
            </select>
          </div>

          {/* Department Select */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Department Filter</label>
            <select
              id="filter-asset-dept"
              title="Department Filter"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.departmentName} ({dept.departmentCode})</option>
              ))}
            </select>
          </div>

          {/* Location Select */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Corporate Location Hub</label>
           <select
              id="filter-asset-loc"
              title="Location Filter"
              value={locFilter}
              onChange={(e) => setLocFilter(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Locations</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.locationName} ({loc.locationCode})</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Table Log rendering */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 text-xs font-mono">
          <span className="h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Refreshing Corporate Inventory Logs...</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-205 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  {showSeqNoColumn && <th className="px-4 py-4 w-16 text-center">Special Id</th>}
                  <th className="px-4 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.size === filteredAssets.length && filteredAssets.length > 0}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 accent-teal-500 cursor-pointer"
                      title="Select all assets"
                    />
                  </th>
                  <th className="px-6 py-4">Asset ID Code</th>
                  <th className="px-6 py-4">Specification / Model Name</th>
                  <th className="px-6 py-4">Section Admin</th>
                  <th className="px-6 py-4">Custodian Assigned</th>
                  <th className="px-6 py-4">Current Hub Site</th>
                  <th className="px-6 py-4">Oem Serial No</th>
                  <th className="px-6 py-4">Deployment Status</th>
                  <th className="px-6 py-4 text-right">Actions Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={colSpanCount} className="px-6 py-16 text-center text-slate-400 italic">No asset inventory logs corresponding with current queries filters.</td>
                  </tr>
                ) : (
                  tableData.map((asset: any) => {
                    // Populate
                    const deptObj = typeof asset.department === "object" ? asset.department : departments.find(d => d._id === asset.department || d.departmentCode === asset.department);
                    const empObj = typeof asset.assignedEmployee === "object" ? asset.assignedEmployee : employees.find(e => e._id === asset.assignedEmployee);
                    const locObj = typeof asset.location === "object" ? asset.location : locations.find(l => l._id === asset.location);
                    const isSelected = selectedAssetIds.has(asset._id);

                    return (
                      <tr key={asset._id} className="hover:bg-slate-50/50 transition">
                        {showSeqNoColumn && (
                          <td className="px-4 py-4 text-center font-mono font-bold text-slate-500 text-[11px]">
                            {String(asset._seqNo).padStart(5, "0")}
                          </td>
                        )}
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectAsset(asset._id)}
                            className="h-3.5 w-3.5 accent-teal-500 cursor-pointer"
                            title="Select this asset"
                          />
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-teal-605">
                          <div className="flex items-center gap-1">
                            {asset.assetId}
                            <button
                              onClick={() => handleCopy(asset.assetId, "Asset ID")}
                              className="text-slate-400 hover:text-teal-600 transition"
                              title="Copy Asset ID"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <div className="flex items-center gap-1">
                            {asset.equipmentName || "Standard Unit"}
                            {asset.equipmentName && (
                              <button
                                onClick={() => handleCopy(asset.equipmentName || "", "Equipment Name")}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Equipment Name"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-700 font-sans font-semibold">
                            {deptObj ? deptObj.departmentName : "HQ / Operations"}
                          </span>
                          <span className="block text-[9px] text-slate-450 font-mono mt-0.5">Code: {asset.departmentCode || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          <div className="flex items-center gap-1">
                            {empObj ? empObj.employeeName : (
                              <span className="text-slate-400 italic text-[11px]">Unassigned / Store</span>
                            )}
                            {empObj && (
                              <button
                                onClick={() => handleCopy(empObj.employeeName || "", "Employee Name")}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Employee Name"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {empObj && <span className="block text-[9px] text-slate-400 font-mono mt-0.5">ID: {empObj.employeeId}</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-sans">
                          <div className="flex items-center gap-1">
                            {locObj ? locObj.locationName : "Main Facility Store"}
                            {locObj && (
                              <button
                                onClick={() => handleCopy(locObj.locationName || "", "Location")}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Location"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            {asset.oemSerialNumber || "—"}
                            {asset.oemSerialNumber && (
                              <button
                                onClick={() => handleCopy(asset.oemSerialNumber || "", "Serial Number")}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Serial Number"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                            asset.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                            asset.status === "Spare" ? "bg-amber-50 border-amber-200 text-amber-600" :
                            asset.status === "Under Repair" ? "bg-rose-50 border-rose-200 text-rose-600" :
                            "bg-slate-50 border-slate-200 text-slate-500"
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-slate-400">
                            <button
                              onClick={() => handleOpenDetails(asset)}
                              className="p-1.5 px-2.5 border border-slate-200 hover:border-slate-300 bg-slate-50 rounded-lg text-slate-500 hover:text-slate-850 hover:bg-slate-100 transition cursor-pointer"
                              title="Review Ledger"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenTransfer(asset)}
                                  className="p-1.5 px-2.5 border border-slate-200 hover:border-indigo-300 bg-slate-50 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                                  title="Transfer / Relocate"
                                >
                                  <ArrowLeftRight className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(asset)}
                                  className="p-1.5 px-2.5 border border-slate-200 hover:border-teal-300 bg-slate-50 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition cursor-pointer"
                                  title="Edit Parameters"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAsset(asset)}
                                  className="p-1.5 px-2.5 border border-slate-200 hover:border-rose-300 bg-slate-50 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                                  title="Delete Asset Permanently"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER / OVERLAY DIALOG */}
      {selectedAsset && !transferModalOpen && (
        <div id="asset-detail-overlay" className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest font-mono">Operations Ledger Log</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">Asset ID: {selectedAsset.assetId}</h3>
              </div>
              <button
                id="close-details-btn"
                type="button"
                title="Close details"
                aria-label="Close details"
                onClick={handleCloseDetails}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable contents */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-705 dark:text-slate-300">
              
              {/* Technical Specifications split */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-150 dark:border-slate-700">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-450 dark:text-slate-500 block">Model specification</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block h-5 truncate">{selectedAsset.equipmentName}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-150 dark:border-slate-700">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-455 dark:text-slate-500 block">OEM Serial Identification</span>
                  <span className="text-xs font-mono font-bold text-teal-605 dark:text-teal-400 mt-1 block">{selectedAsset.oemSerialNumber || "—"}</span>
                </div>
              </div>

              {/* Status and Custody Details Block */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700 rounded-xl p-4 space-y-4">
                <h4 className="text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold">Ownership & Context</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-450 dark:text-slate-500 font-medium block">Department Code</span>
                    <span className="text-slate-805 dark:text-slate-200 block font-bold mt-1">
                      {typeof selectedAsset.department === "object" ? (selectedAsset.department as any).departmentName : String(selectedAsset.departmentCode)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-455 dark:text-slate-500 font-medium block">Custodian Assigned</span>
                    <span className="text-slate-805 dark:text-slate-200 block font-bold mt-1">
                      {selectedAsset.assignedEmployee ? (typeof selectedAsset.assignedEmployee === "object" ? (selectedAsset.assignedEmployee as any).employeeName : "Assigned") : "In Store / Warehouse"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-455 dark:text-slate-500 font-medium block">Target Location Coordinates</span>
                    <span className="text-slate-805 dark:text-slate-200 block font-bold mt-1">
                      {selectedAsset.location ? (typeof selectedAsset.location === "object" ? (selectedAsset.location as any).locationName : "Warehouse Hub") : "Central Store"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-455 dark:text-slate-500 font-medium block">Technical Person in Charge (Technician)</span>
                    <span className="text-slate-855 dark:text-slate-200 block font-bold mt-1">{selectedAsset.technician || "HQ Tech Team"}</span>
                  </div>
                  <div>
                    <span className="text-slate-455 dark:text-slate-500 font-medium block">Maintenance Team</span>
                    <span className="text-slate-855 dark:text-slate-200 block font-bold mt-1">{selectedAsset.maintenanceTeam || "Central Engineering"}</span>
                  </div>
                  <div>
                    <span className="text-slate-455 dark:text-slate-500 font-medium block">Work Center</span>
                    <span className="text-slate-855 dark:text-slate-200 block font-bold text-indigo-600 dark:text-indigo-400 mt-1">{selectedAsset.workCenter || "General Office"}</span>
                  </div>
                </div>

                {selectedAsset.remarks && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 font-medium block text-xs">Administrative Logs & Remarks</span>
                    <p className="text-slate-700 dark:text-slate-300 italic mt-1 font-sans text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                      &ldquo;{selectedAsset.remarks}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Transfer Relocation Logs */}
              <div>
                <h4 className="text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold mb-3 flex items-center gap-1">
                  <ArrowLeftRight className="h-4 w-4 text-indigo-605 dark:text-indigo-400" />
                  <span>Transfer Relocation History Logs</span>
                </h4>
                
                {loadingMovements ? (
                  <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 font-mono">Retrieving transfer checkpoints...</div>
                ) : movementsHistory.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-150 dark:border-slate-700">
                    No relocation history registers logged for this device. Stable single custodian deployment.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-5">
                    {movementsHistory.map((mov, i) => (
                      <div key={mov._id || i} className="relative pl-6">
                        {/* Bullet */}
                        <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-teal-500 -translate-x-1" />
                        <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-150 dark:border-slate-700">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-indigo-600 font-bold text-[10px]">{mov.movementId}</span>
                            <span className="text-[9px] text-slate-450 font-mono">
                              {new Date(mov.transferDate).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 mt-1.5">
                            <div>
                              <span className="text-slate-405 text-[8px] uppercase block font-bold">Assigned Custodian Target</span>
                              <span className="font-bold text-slate-700">
                                {mov.toEmployee ? mov.toEmployee.employeeName : "Store/N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-405 text-[8px] uppercase block font-bold">Location Destination</span>
                              <span className="font-bold text-slate-700">
                                {mov.toLocation ? mov.toLocation.locationName : "N/A"}
                              </span>
                            </div>
                          </div>

                          {mov.remarks && (
                            <p className="text-[10px] text-slate-500 italic border-t border-slate-200 pt-1.5 mt-1.5">
                              &ldquo;{mov.remarks}&rdquo;
                            </p>
                          )}
                          
                          {mov.movedBy && (
                            <div className="text-[9px] text-slate-450 text-right mt-1 font-mono">
                              Transferred by: {mov.movedBy.name || "Administrator"}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-end gap-3">
              <button 
                id="close-detail-footer-btn"
                onClick={handleCloseDetails} 
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl text-xs text-slate-700 font-bold transition cursor-pointer"
              >
                Dismiss Ledger
              </button>
              {isAdmin && (
                <button
                  id="trigger-relocate-btn"
                  onClick={() => handleOpenTransfer(selectedAsset)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-605 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>Execute Relocation</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
      {/* RELOCATION TRANSFER SUB-DIALOG */}
      {transferModalOpen && selectedAsset && (
        <div id="transfer-dialog-overlay" className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-teal-600 font-bold uppercase tracking-widest">Reassign Asset Custodian</span>
                <h3 className="text-sm font-bold text-slate-850 uppercase mt-0.5">Asset Code: {selectedAsset.assetId}</h3>
              </div>
              <button 
                id="close-transfer-modal-btn"
                type="button"
                title="Close Transfer Modal"
                onClick={handleCloseTransfer} 
                className="text-slate-400 hover:text-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form id="transfer-workflow-form" onSubmit={handleSaveTransfer} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-250 rounded-xl text-xs text-rose-650 font-mono">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">New Employee Custodian</label>
                <select
                  id="transfer-target-employee"
                  value={transferToEmployeeId}
                  title="New Employee Custodian"
                  onChange={(e) => setTransferToEmployeeId(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-202 rounded-xl text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-550"
                >
                  <option value="">Keep Unassigned / Store</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>{emp.employeeName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Destination Hub Location</label>
                <select
                  id="transfer-target-location"
                  value={transferToLocationId}
                  title="Destination Hub Location"
                  onChange={(e) => setTransferToLocationId(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-202 rounded-xl text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-550"
                >
                  <option value="">Choose Site location</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>{loc.locationName} ({loc.locationCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reason / Relocation Remarks</label>
                <textarea
                  id="transfer-remarks-input"
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="e.g. Assigned laptop to Sales executive due to remote onboarding."
                  className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-202 rounded-xl text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-550 h-24 resize-none placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 mt-6 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  id="cancel-relocate-btn"
                  type="button"
                  onClick={handleCloseTransfer}
                  className="px-4 py-2 border border-slate-200 bg-white text-xs text-slate-600 hover:text-slate-850 rounded-xl font-bold transition cursor-pointer"
                >
                  Discard
                </button>
                <button
                  id="confirm-relocate-btn"
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-605 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Authorize Transfer
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ASSET CREATION & REGISTRATION FORM MODAL */}
      {registerModalOpen && (
        <div id="asset-registration-overlay" className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase flex items-center gap-1.5 tracking-wider">
                <span>{editingAsset ? "Revise Asset" : "Register New Asset Node"}</span>
                {editingAsset && <span className="text-teal-600 font-mono font-bold">({editingAsset.assetId})</span>}
              </h3>
              <button 
                id="close-register-modal-btn"
                title="Close"
                onClick={handleCloseRegister} 
                className="text-slate-400 hover:text-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form id="asset-registration-form" onSubmit={handleSaveAsset} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-205 rounded-xl text-xs text-rose-650 font-mono">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Equipment Name *</label>
                  <select
                    id="reg-input-equipment"
                    value={formEquipmentId}
                    title="Equipment Name"
                    onChange={(e) => setFormEquipmentId(e.target.value)}
                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  >
                    <option value="">Choose Spec Master</option>
                    {equipment.map((eq) => (
                      <option key={eq._id} value={eq._id}>{eq.equipmentName} ({eq.equipmentCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Department *</label>
                  <select
                    id="reg-input-department"
                    title="Department "
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  >
                    <option value="">Select Section</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.departmentName} ({d.departmentCode})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Location *</label>
                  <select
                    id="reg-input-location"
                    title="Location"
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(e.target.value)}
                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  >
                    <option value="">Select Coordinates</option>
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>{loc.locationName} ({loc.locationCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Assigned user</label>
                  <select
                    id="reg-input-assigned-user"
                    title="Assigned user"
                    value={formAssignedEmployeeId}
                    onChange={(e) => setFormAssignedEmployeeId(e.target.value)}
                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Leave Unassigned / Spare</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.employeeName} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Serial identification *</label>
                  <input
                    id="reg-input-serial"
                    type="text"
                    value={formOemSerial}
                    onChange={(e) => setFormOemSerial(e.target.value)}
                    placeholder="e.g. C02X87ZG08Y2"
                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-201 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Operation Status *</label>
                  <select
                    id="reg-input-status"
                    title="Operation Status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  >
                    <option value="Active">Active Deployment</option>
                    <option value="Spare">Spare in Store</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Scrap">Scrap</option>
                  </select>
                </div>
              </div>

              {/* Maintenance & Custom characteristics fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Technician</label>
                 <select
                    id="reg-input-employee"
                    title="Technician"
                    value={formAssignedEmployeeId}
                    onChange={(e) => setFormAssignedEmployeeId(e.target.value)}
                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Technician Name</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.employeeName} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Maint. Team</label>
                  <select
                    id="reg-input-dept"
                    title="Maint. Team"
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  >
                    <option value="">Select Section</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.departmentName} ({d.departmentCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Work Center</label>
                  <input
                    id="reg-input-wc"
                    type="text"
                    value={formWorkCenter}
                    onChange={(e) => setFormWorkCenter(e.target.value)}
                    placeholder="e.g. Desk Hub-C"
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-805 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-555"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Remarks & Notes</label>
                <textarea
                  id="reg-input-remarks"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Additional specs or remarks on procurement"
                  className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-202 rounded-xl text-xs text-slate-705 focus:outline-none focus:ring-1 focus:ring-teal-550 h-16 resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 mt-6 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  id="reg-cancel-btn"
                  type="button"
                  onClick={handleCloseRegister}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:text-slate-850 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="reg-submit-btn"
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-610 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  {editingAsset ? "Save Specification Details" : "Publish Asset Unit"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
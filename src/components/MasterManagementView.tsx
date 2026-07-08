import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { Department, EquipmentMaster, Location, Employee, User } from "../types";
import {
  Plus, Edit2, Trash2, Search, Building2, Laptop2, MapPin,
  Users, X, ShieldAlert, Eye, Upload, ShieldCheck, Copy
} from "lucide-react";

interface MasterManagementViewProps {
  currentUser: User | null;
}

type TabType = "departments" | "equipment" | "locations" | "employees";

export default function MasterManagementView({ currentUser }: MasterManagementViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("departments");
  const isAdmin = currentUser?.role === "Admin" || currentUser?.role === "SuperAdmin";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [equipment, setEquipment] = useState<EquipmentMaster[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptStatus, setDeptStatus] = useState(true);

  const [eqName, setEqName] = useState("");
  const [eqCode, setEqCode] = useState("");
  const [eqCategory, setEqCategory] = useState("Laptops");
  const [eqStatus, setEqStatus] = useState(true);

  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");

  const [empIdString, setEmpIdString] = useState("");
  const [empName, setEmpName] = useState("");
  const [empMail, setEmpMail] = useState("");
  const [empDeptId, setEmpDeptId] = useState("");
  const [empStatus, setEmpStatus] = useState<"Active" | "Inactive">("Active");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "departments") {
        const res = await api.getDepartments();
        setDepartments(res);
      } else if (activeTab === "equipment") {
        const res = await api.getEquipment();
        setEquipment(res);
      } else if (activeTab === "locations") {
        const res = await api.getLocations();
        setLocations(res);
      } else if (activeTab === "employees") {
        const [empRes, deptRes] = await Promise.all([
          api.getEmployees(),
          api.getDepartments(),
        ]);
        setEmployees(empRes);
        setDepartments(deptRes);
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve configuration archives.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    closeAndResetForm();
  }, [activeTab]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const closeAndResetForm = () => {
    setModalOpen(false);
    setEditingId(null);
    setError(null);
    setDeptName("");
    setDeptCode("");
    setDeptStatus(true);
    setEqName("");
    setEqCode("");
    setEqCategory("Laptops");
    setEqStatus(true);
    setLocName("");
    setLocCode("");
    setEmpIdString("");
    setEmpName("");
    setEmpMail("");
    setEmpDeptId("");
    setEmpStatus("Active");
  };

  const openAddModal = () => {
    closeAndResetForm();
    closeUploadModal();
    setModalOpen(true);
  };

  const openUploadModal = () => {
    closeAndResetForm();
    setUploadModalOpen(true);
    setUploadFile(null);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setUploadFile(null);
  };

  const openEditModal = (item: any) => {
    closeAndResetForm();
    closeUploadModal();
    setEditingId(item._id);
    setModalOpen(true);
    if (activeTab === "departments") {
      setDeptName(item.departmentName);
      setDeptCode(item.departmentCode);
      setDeptStatus(item.activeStatus ?? true);
    } else if (activeTab === "equipment") {
      setEqName(item.equipmentName);
      setEqCode(item.equipmentCode);
      setEqCategory(item.category || "Laptops");
      setEqStatus(item.activeStatus ?? true);
    } else if (activeTab === "locations") {
      setLocName(item.locationName);
      setLocCode(item.locationCode);
    } else if (activeTab === "employees") {
      setEmpIdString(item.employeeId);
      setEmpName(item.employeeName);
      setEmpMail(item.email || "");
      setEmpDeptId(item.department && typeof item.department === "object" ? item.department._id : item.department || "");
      setEmpStatus(item.status || "Active");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError("Authorization denied. Standard user profile is read-only.");
      return;
    }
    try {
      if (activeTab === "departments") {
        if (!deptName || !deptCode) throw new Error("Please formulate Name & System Code.");
        if (editingId) {
          await api.updateDepartment(editingId, { departmentName: deptName, departmentCode: deptCode, activeStatus: deptStatus });
          showSuccess("Department logs amended successfully.");
        } else {
          await api.createDepartment({ departmentName: deptName, departmentCode: deptCode, activeStatus: deptStatus });
          showSuccess("New Department configuration cataloged.");
        }
      } else if (activeTab === "equipment") {
        if (!eqName || !eqCode) throw new Error("Category description and asset master identifiers needed.");
        if (editingId) {
          await api.updateEquipment(editingId, { equipmentName: eqName, equipmentCode: eqCode, category: eqCategory, activeStatus: eqStatus });
          showSuccess("Equipment record logged.");
        } else {
          await api.createEquipment({ equipmentName: eqName, equipmentCode: eqCode, category: eqCategory, activeStatus: eqStatus });
          showSuccess("Equipment specification master initiated.");
        }
      } else if (activeTab === "locations") {
        if (!locName || !locCode) throw new Error("Building descriptor & room code coordinates required.");
        if (editingId) {
          await api.updateLocation(editingId, { locationName: locName, locationCode: locCode });
          showSuccess("Location master details indexed.");
        } else {
          await api.createLocation({ locationName: locName, locationCode: locCode });
          showSuccess("New Building Site added to index.");
        }
      } else if (activeTab === "employees") {
        if (!empIdString || !empName || !empMail) throw new Error("Please fulfill Name, Corporate Mail, and System ID.");
        const payload = { employeeId: empIdString, employeeName: empName, email: empMail, department: empDeptId || undefined, status: empStatus };
        if (editingId) {
          await api.updateEmployee(editingId, payload);
          showSuccess("Corporate Employee directory details revised.");
        } else {
          await api.createEmployee(payload);
          showSuccess("New Employee credentials registered.");
        }
      }
      closeAndResetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to commit master record amendments.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you certain you wish to purge "${name}" from memory?`)) return;
    try {
      if (activeTab === "departments") await api.deleteDepartment(id);
      else if (activeTab === "equipment") await api.deleteEquipment(id);
      else if (activeTab === "locations") await api.deleteLocation(id);
      else if (activeTab === "employees") await api.deleteEmployee(id);
      showSuccess(`"${name}" has been disabled/removed.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Archive linkage integrity restricts purging this instance.");
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFile) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("type", activeTab);
      const token = localStorage.getItem("tgh_token");
      
      console.log("[MasterUpload] Starting file upload...", {
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        fileType: uploadFile.type,
        uploadType: activeTab,
        hasToken: !!token
      });
      
      const res = await fetch("/api/upload/master", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error("[MasterUpload] Upload failed:", {
          status: res.status,
          statusText: res.statusText,
          response: data
        });
        throw new Error(data.message || `Upload failed (${res.status})`);
      }
      
      console.log("[MasterUpload] Upload successful:", data);
      showSuccess(data.message || "Data uploaded successfully.");
      closeUploadModal();
      fetchData();
    } catch (err: any) {
      console.error("[MasterUpload] Error:", err.message);
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [".csv", ".xlsx", ".xls", ".json"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (validTypes.includes(ext)) {
        setUploadFile(file);
      } else {
        alert("Please upload a valid CSV, Excel, or JSON file.");
        setUploadFile(null);
      }
    }
  };

  const qClean = searchQuery.toLowerCase().trim();
  const filteredDepartments = departments.filter((d) => (d.departmentName?.toLowerCase().includes(qClean)) || (d.departmentCode?.toLowerCase().includes(qClean)));
  const filteredEquipment = equipment.filter((e) => (e.equipmentName?.toLowerCase().includes(qClean)) || (e.equipmentCode?.toLowerCase().includes(qClean)) || (e.category?.toLowerCase().includes(qClean)));
  const filteredLocations = locations.filter((l) => (l.locationName?.toLowerCase().includes(qClean)) || (l.locationCode?.toLowerCase().includes(qClean)));
  const filteredEmployees = employees.filter((emp) => (emp.employeeName?.toLowerCase().includes(qClean)) || (emp.employeeId?.toLowerCase().includes(qClean)) || (emp.email?.toLowerCase().includes(qClean)));

  return (
    <div id="master-management-wrapper" className="space-y-6 font-sans">

      {/* Simple Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        <button id="tab-btn-depts" type="button" onClick={() => setActiveTab("departments")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === "departments" ? "bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <Building2 className="h-4 w-4" />
          <span>Departments</span>
        </button>
        <button id="tab-btn-equipment" type="button" onClick={() => setActiveTab("equipment")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === "equipment" ? "bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <Laptop2 className="h-4 w-4" />
          <span>Equipment Specification</span>
        </button>
        <button id="tab-btn-locations" type="button" onClick={() => setActiveTab("locations")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === "locations" ? "bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <MapPin className="h-4 w-4" />
          <span>Location Hubs</span>
        </button>
        <button id="tab-btn-employees" type="button" onClick={() => setActiveTab("employees")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === "employees" ? "bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <Users className="h-4 w-4" />
          <span>Employee Directory</span>
        </button>
      </div>

      {/* Header Row with Register Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            Configuration Management
          </h2>
          <p className="text-[11px] text-slate-450 mt-1">
            Manage organizational master data and system parameters.
          </p>
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap gap-3">
            <button id="master-add-btn" type="button" onClick={openAddModal} className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              <span>
                {activeTab === "departments" && "Register Department"}
                {activeTab === "equipment" && "New Specification"}
                {activeTab === "locations" && "New Location"}
                {activeTab === "employees" && "Add Employee"}
              </span>
            </button>
            {activeTab === "employees" && (
              <button id="master-upload-btn" type="button" onClick={openUploadModal} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Data</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50">
            <Eye className="h-3.5 w-3.5 text-indigo-600" />
            <span>Role: Standard Reader (View Only)</span>
          </div>
        )}
      </div>

      {isAdmin && activeTab === "employees" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <a href="/sample-employees-import.csv" download className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white text-[10px] font-semibold rounded-xl shadow-sm hover:bg-teal-700 transition">
            <Upload className="h-3.5 w-3.5" />
            Download Employee Sample
          </a>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-600">
            <p className="font-semibold text-slate-800 mb-2">Sample upload format</p>
            <p className="leading-snug">employeeId, employeeName, email, department, status</p>
          </div>
        </div>
      )}

      {/* Success notification banner */}
      {successMsg && (
        <div id="master-success-bar" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <span>✔</span> {successMsg}
        </div>
      )}

      {/* Core Lists Filter controls */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input id="master-search-input" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search in ${activeTab}...`} className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-500 transition shadow-sm" />
      </div>

      {/* Tables & Lists Render block */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 text-xs font-mono">
          <span className="h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing Master Datasets...</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

          {/* DEPARTMENTS TABLE */}
          {activeTab === "departments" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Department Title</th>
                    <th className="px-6 py-4">Operational Code</th>
                    <th className="px-6 py-4">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredDepartments.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No departmental records detected.</td></tr>
                  ) : filteredDepartments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1">
                          {dept.departmentName}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(dept.departmentName).then(() => showSuccess("Department name copied"));
                            }}
                            className="text-slate-400 hover:text-teal-600 transition"
                            title="Copy Department Name"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-teal-600 font-bold">
                        <div className="flex items-center gap-1">
                          {dept.departmentCode}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(dept.departmentCode).then(() => showSuccess("Department code copied"));
                            }}
                            className="text-slate-400 hover:text-teal-600 transition"
                            title="Copy Department Code"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${dept.activeStatus ?? true ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"}`}>
                          {dept.activeStatus ?? true ? "Operational" : "Suspended"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button onClick={() => openEditModal(dept)} className="p-1 px-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer" title="Edit Record"><Edit2 className="h-3 w-3" /></button>
                            <button onClick={() => handleDelete(dept._id, dept.departmentName)} className="p-1 px-2 border border-rose-200 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition cursor-pointer" title="Purge Record"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* EQUIPMENT MASTERS TABLE */}
          {activeTab === "equipment" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Hardware Specification</th>
                    <th className="px-6 py-4">Catalog Identifier</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredEquipment.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No hardware profiles defined.</td></tr>
                  ) : filteredEquipment.map((eq) => (
                    <tr key={eq._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1">
                          {eq.equipmentName}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(eq.equipmentName).then(() => showSuccess("Equipment name copied"));
                            }}
                            className="text-slate-400 hover:text-teal-600 transition"
                            title="Copy Equipment Name"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-teal-600 font-bold">
                        <div className="flex items-center gap-1">
                          {eq.equipmentCode}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(eq.equipmentCode).then(() => showSuccess("Equipment code copied"));
                            }}
                            className="text-slate-400 hover:text-teal-600 transition"
                            title="Copy Equipment Code"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{eq.category || "General"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${eq.activeStatus ?? true ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"}`}>
                          {eq.activeStatus ?? true ? "Active Spec" : "Retired Spec"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button onClick={() => openEditModal(eq)} className="p-1 px-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer" title="Edit specification"><Edit2 className="h-3 w-3" /></button>
                            <button onClick={() => handleDelete(eq._id, eq.equipmentName)} className="p-1 px-2 border border-rose-200 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition cursor-pointer" title="Remove specification"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* LOCATIONS TABLE */}
          {activeTab === "locations" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Location Name</th>
                    <th className="px-6 py-4">Location Code</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredLocations.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">No facility locations logged.</td></tr>
                  ) : filteredLocations.map((loc) => (
                    <tr key={loc._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1">
                          {loc.locationName}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(loc.locationName).then(() => showSuccess("Location name copied"));
                            }}
                            className="text-slate-400 hover:text-teal-600 transition"
                            title="Copy Location Name"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-teal-600 font-bold">
                        <div className="flex items-center gap-1">
                          {loc.locationCode}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(loc.locationCode).then(() => showSuccess("Location code copied"));
                            }}
                            className="text-slate-400 hover:text-teal-600 transition"
                            title="Copy Location Code"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button onClick={() => openEditModal(loc)} className="p-1 px-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer" title="Edit Coordinates"><Edit2 className="h-3 w-3" /></button>
                            <button onClick={() => handleDelete(loc._id, loc.locationName)} className="p-1 px-2 border border-rose-200 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition cursor-pointer" title="De-register site"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* EMPLOYEES DIRECTORY TABLE */}
          {activeTab === "employees" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Employee Name</th>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredEmployees.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No assigned personnel registry discovered.</td></tr>
                  ) : filteredEmployees.map((emp) => {
                    const deptObj = typeof emp.department === "object" ? emp.department : departments.find((d) => d._id === emp.department || d.departmentCode === emp.department);
                    return (
                      <tr key={emp._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <div className="flex items-center gap-1">
                            {emp.employeeName}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(emp.employeeName).then(() => showSuccess("Employee name copied"));
                              }}
                              className="text-slate-400 hover:text-teal-600 transition"
                              title="Copy Employee Name"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-teal-600 font-bold">
                          <div className="flex items-center gap-1">
                            {emp.employeeId}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(emp.employeeId).then(() => showSuccess("Employee ID copied"));
                              }}
                              className="text-slate-400 hover:text-teal-600 transition"
                              title="Copy Employee ID"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          <div className="flex items-center gap-1">
                            {emp.email || "N/A"}
                            {emp.email && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(emp.email || "").then(() => showSuccess("Email copied"));
                                }}
                                className="text-slate-400 hover:text-teal-600 transition"
                                title="Copy Email"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">{deptObj ? deptObj.departmentName : "Independent / HQ"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${emp.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"}`}>
                            {emp.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button onClick={() => openEditModal(emp)} className="p-1 px-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer" title="Edit Employee Credentials"><Edit2 className="h-3 w-3" /></button>
                              <button onClick={() => handleDelete(emp._id, emp.employeeName)} className="p-1 px-2 border border-rose-200 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition cursor-pointer" title="Dismiss Personnel Record"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FORM MODAL PANEL */}
      {modalOpen && (
        <div id="master-form-modal" className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-150 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>{editingId ? "Revise" : "Initiate"}</span>
                <span className="text-teal-600">
                  {activeTab === "departments" && "Department Parameters"}
                  {activeTab === "equipment" && "Hardware Specification"}
                  {activeTab === "locations" && "Warehouse Hub Coordinates"}
                  {activeTab === "employees" && "Employee Registry"}
                </span>
              </h3>
              <button type="button" id="close-master-modal-btn" onClick={closeAndResetForm} aria-label="Close form modal" className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form id="master-modal-form" onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div id="modal-form-error" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-mono flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {activeTab === "departments" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Department Name</label>
                    <input id="input-dept-name" type="text" value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Finance & Accounting" className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Corporate Code (Unique Prefix)</label>
                    <input id="input-dept-code" type="text" value={deptCode} onChange={(e) => setDeptCode(e.target.value.toUpperCase())} placeholder="e.g. FIN" className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" required />
                  </div>
                  <label htmlFor="input-dept-status" className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150 cursor-pointer">
                    <input id="input-dept-status" type="checkbox" checked={deptStatus} onChange={(e) => setDeptStatus(e.target.checked)} className="h-4 w-4 accent-teal-500 rounded bg-white border-slate-200" />
                    <div>
                      <span className="block text-xs font-bold text-slate-700">Department Status Active</span>
                      <span className="text-[10px] text-slate-400 font-mono">Suspended sections restrict asset intake.</span>
                    </div>
                  </label>
                </div>
              )}

              {activeTab === "equipment" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Model specifications name</label>
                    <input id="input-eq-name" type="text" value={eqName} onChange={(e) => setEqName(e.target.value)} placeholder="e.g. MacBook Pro M3 Max" className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Equipment identification category code</label>
                    <input id="input-eq-code" type="text" value={eqCode} onChange={(e) => setEqCode(e.target.value.toUpperCase())} placeholder="e.g. LAP-001" className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" required />
                  </div>
                  <div>
                    <label htmlFor="input-eq-category" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Device Category Group</label>
                    <select id="input-eq-category" aria-label="Device Category Group" value={eqCategory} onChange={(e) => setEqCategory(e.target.value)} className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500">
                      <option value="Laptops">Laptops & Desktops</option>
                      <option value="Peripherals">Displays / Peripherals / Printers</option>
                      <option value="Servers">Core Infrastructure / Servers</option>
                      <option value="Networking">Networking / Switches / Firewalls</option>
                      <option value="Office Equipment">Office Infrastructure & Utility</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <label htmlFor="input-eq-status" className="flex items-center gap-3">
                      <input id="input-eq-status" type="checkbox" checked={eqStatus} onChange={(e) => setEqStatus(e.target.checked)} className="h-4 w-4 accent-teal-500 rounded bg-white border-slate-200" />
                      <div>
                        <span className="block text-xs font-bold text-slate-700">Specifications Profile Available</span>
                        <span className="text-[10px] text-slate-400 font-mono">Retiring profiles locks them from new items.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "locations" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Building Site Landmark Description</label>
                    <input id="input-loc-name" type="text" value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="e.g. Headquarters Block-B" className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Location Identifier Room Code</label>
                    <input id="input-loc-code" type="text" value={locCode} onChange={(e) => setLocCode(e.target.value.toUpperCase())} placeholder="e.g. HQ-B2" className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" required />
                  </div>
                </div>
              )}

              {activeTab === "employees" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Corporate employee ID</label>
                      <input id="input-emp-id" type="text" value={empIdString} onChange={(e) => setEmpIdString(e.target.value.toUpperCase())} placeholder="e.g. ETH-1092" className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Registry Full Name</label>
                      <input id="input-emp-name" type="text" value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="e.g. John Doe" className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Corporate Communications Email</label>
                    <input id="input-emp-mail" type="email" value={empMail} onChange={(e) => setEmpMail(e.target.value.toLowerCase())} placeholder="e.g. jdoe@tgh.com" className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Affiliated Department</label>
                    <select id="input-emp-dept" title="Affiliated Department" value={empDeptId} onChange={(e) => setEmpDeptId(e.target.value)} className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500">
                      <option value="">Unassigned / Independent</option>
                      {departments.map((dept) => <option key={dept._id} value={dept._id}>{dept.departmentName} ({dept.departmentCode})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Personnel status</label>
                    <select id="input-emp-status" title="Personnel status" value={empStatus} onChange={(e) => setEmpStatus(e.target.value as "Active" | "Inactive")} className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500">
                      <option value="Active">Active Employee</option>
                      <option value="Inactive">Exited / Suspended Profile</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150 mt-6 bg-slate-50 -mx-6 -mb-6 p-6">
                <button id="cancel-form-btn" type="button" onClick={closeAndResetForm} className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl transition cursor-pointer">Discard Changes</button>
                <button id="save-form-btn" type="submit" className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition cursor-pointer">{editingId ? "Apply Modifications" : "Confirm Entry"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL PANEL */}
      {uploadModalOpen && (
        <div id="master-upload-modal" className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-150 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Upload className="h-4 w-4 text-teal-600" />
                Upload Data - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h3>
              <button type="button" title="Close" onClick={closeUploadModal} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-mono flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold mb-1">Select a file to upload</p>
                <p className="text-[10px] text-slate-400 mb-4">Supports CSV, Excel (.xlsx, .xls), or JSON format</p>
                <label className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg cursor-pointer transition">
                  Choose File
                  <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              {uploadFile && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-xs font-mono text-emerald-700 truncate">{uploadFile.name}</span>
                  <span className="text-[10px] text-emerald-500">({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] text-slate-500 font-mono">
                <p className="font-bold text-slate-700 mb-1">Expected columns for {activeTab}:</p>
                {activeTab === "departments" && <p>departmentName, departmentCode, activeStatus</p>}
                {activeTab === "equipment" && <p>equipmentName, equipmentCode, category, activeStatus</p>}
                {activeTab === "locations" && <p>locationName, locationCode</p>}
                {activeTab === "employees" && (
                  <>
                    <p>employeeId, employeeName, email, department, status</p>
                    <p className="mt-1 text-[9px] text-slate-400">Department can be either the department code (e.g. IT) or the full department name.</p>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150">
                <button type="button" onClick={closeUploadModal} className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl transition cursor-pointer">Cancel</button>
                <button type="button" onClick={handleUploadFile} disabled={!uploadFile || uploadLoading} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition cursor-pointer">
                  {uploadLoading ? "Uploading..." : "Upload Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
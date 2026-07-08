import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { Department, EquipmentMaster, Location, Employee, User } from "../types";
import { UploadCloud, CheckCircle2, HelpCircle, FileSpreadsheet, FileUp, PlusCircle, X } from "lucide-react";

interface ImportViewProps {
  currentUser: User | null;
}

type ImportTab = "bulk" | "single";
type ParsedRow = Record<string, unknown>;

const initialFormData = {
  equipmentId: "",
  departmentId: "",
  locationId: "",
  assignedEmployeeId: "",
  oemSerialNumber: "",
  status: "Spare",
  technician: "",
  maintenanceTeam: "",
  workCenter: "",
  remarks: "",
};

export default function ImportView({ currentUser }: ImportViewProps) {
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === "Admin" || currentUser?.role === "SuperAdmin";

  const [activeTab, setActiveTab] = useState<ImportTab>("bulk");

  // ============ Shared Reference Data ============
  const [departments, setDepartments] = useState<Department[]>([]);
  const [equipment, setEquipment] = useState<EquipmentMaster[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [depts, eqs, locs, emps] = await Promise.all([
          api.getDepartments(),
          api.getEquipment(),
          api.getLocations(),
          api.getEmployees(),
        ]);
        setDepartments(depts);
        setEquipment(eqs);
        setLocations(locs);
        setEmployees(emps);
      } catch {
        // Safe fail
      }
    };
    fetchReferences();
  }, []);

  // ============ Bulk Import State ============
  const [inputText, setInputText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [fileRows, setFileRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============ Single Asset Form State ============
  const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleSuccess, setSingleSuccess] = useState<string | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

  // ============ Bulk: Parse CSV Text ============
  const handleParseCsv = () => {
    setBulkError(null);
    setBulkSuccess(null);
    if (!inputText.trim()) {
      setBulkError("Please paste CSV data or load a file first.");
      return;
    }

    try {
      const lines = inputText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        throw new Error("CSV requires a Header Row followed by at least 1 Data Record row.");
      }

      const delimiter = lines[0].includes("\t") ? "\t" : ",";
      const headers = lines[0].split(delimiter).map(h => h.replace(/["]+/g, "").trim().toLowerCase());

      const itemRows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.replace(/["]+/g, "").trim());
        const rowObj: any = {};
        headers.forEach((hdr, idx) => {
          rowObj[hdr] = cols[idx] || "";
        });
        itemRows.push(rowObj);
      }

      setParsedRows(itemRows);
      setBulkSuccess(`Formatted ${itemRows.length} records from text input. Click "Commit Valid Rows" to import.`);
    } catch (err: any) {
      setBulkError(err.message || "Failed to parse input layout.");
    }
  };

  // ============ Bulk: Handle File Upload ============
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkError(null);
    setBulkSuccess(null);

    try {
      const result = await api.uploadBulkFile(file);
      setFileRows(result.rows);
      setFileName(result.fileName);
      setParsedRows([]);
      setInputText("");
      setBulkSuccess(`Loaded ${result.rows.length} records from "${result.fileName}". Click "Verify & Pre-Map" to review.`);
    } catch (err: any) {
      setBulkError(err.message || "Failed to read file.");
    }

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============ Bulk: Map File Rows to ParsedRows ============
  const handleMapFileRows = () => {
    if (!fileRows || fileRows.length === 0) {
      setBulkError("No file data loaded. Please upload a file first.");
      return;
    }
    setParsedRows(fileRows);
    setBulkSuccess(`Mapped ${fileRows.length} records from "${fileName}". Click "Commit Valid Rows" to import.`);
  };

  // ============ Bulk: Commit Upload ============
  const handleBulkUpload = async () => {
    if (!isAdmin) return;
    setBulkError(null);
    setBulkSuccess(null);
    
    console.log("[BulkImport] Starting bulk asset import with", parsedRows.length, "rows");

    if (parsedRows.length === 0) {
      setBulkError("No rows parsed. Parse CSV text or load a file first.");
      return;
    }

    // Map parsed row keys to server-expected format
    const mappedRows = parsedRows.map(row => {
      const equipmentCode = (row.equipment_code || row.equipmentcode || row.equipmentCode || row.equipment || "").toString().toUpperCase();
      const departmentCode = (row.department_code || row.departmentcode || row.departmentCode || row.department || "").toString().toUpperCase();
      const locationCode = (row.location_code || row.locationcode || row.locationCode || row.location || "").toString().toUpperCase();
      const oemSerialNumber = row.serial || row.oem_serial || row.oemserial || row.oem_serial_number || row.oemSerialNumber || "";
      const employeeId = (row.assigned_employee_id || row.employee_id || row.employeeid || row.employee || row.employeeId || "").toString().toUpperCase();
      const status = row.status || "Spare";
      const technician = row.technician || "";
      const maintenanceTeam = row.maintenance_team || row.maintenanceTeam || "";
      const workCenter = row.work_center || row.workCenter || "";
      const remarks = row.remarks || "";

      return {
        departmentCode,
        equipmentCode,
        locationCode,
        oemSerialNumber,
        employeeId: employeeId || undefined,
        status,
        technician,
        maintenanceTeam,
        workCenter,
        remarks,
      };
    });

    setBulkLoading(true);
    try {
      console.log("[BulkImport] Sending", mappedRows.length, "mapped rows to server");
      const res = await api.bulkImport(mappedRows);
      console.log("[BulkImport] Server response:", res);
      setBulkSuccess(`Success! Inserted ${res.count} asset records.`);
      setParsedRows([]);
      setInputText("");
      setFileRows(null);
      setFileName("");
      navigate("/assets");
    } catch (err: any) {
      console.error("[BulkImport] Error:", err.message);
      setBulkError(err.message || "Bulk import failed.");
    } finally {
      setBulkLoading(false);
    }
  };

  // ============ Bulk: Load Example CSV ============
  const loadExampleSeedCsv = () => {
    const eqCode = equipment[0]?.equipmentCode || "LT";
    const deptCode = departments[0]?.departmentCode || "IT";
    const locCode = locations[0]?.locationCode || "TGH-FB-B1-1F";
    const empId = employees[0]?.employeeId || "EMP001";

    const csvSample = [
      "equipmentCode,departmentCode,locationCode,serial,employeeId,status",
      `${eqCode},${deptCode},${locCode},SN-EXAMPLE-001,${empId},Active`,
      `${eqCode},${deptCode},${locCode},SN-EXAMPLE-002,,Spare`,
      `${eqCode},${deptCode},${locCode},SN-EXAMPLE-003,,Under Repair`,
    ].join("\n");

    setInputText(csvSample);
    setBulkError(null);
    setBulkSuccess(null);
    setParsedRows([]);
    setFileRows(null);
  };

  // ============ Single: Handle Form Submit ============
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError(null);
    setSingleSuccess(null);

    // Basic validation
    if (!formData.equipmentId) { setSingleError("Equipment is required."); return; }
    if (!formData.departmentId) { setSingleError("Department is required."); return; }
    if (!formData.locationId) { setSingleError("Location is required."); return; }
    if (!formData.oemSerialNumber.trim()) { setSingleError("OEM Serial Number is required."); return; }

    setSingleLoading(true);
    try {
      const payload = {
        equipmentId: formData.equipmentId,
        departmentId: formData.departmentId,
        locationId: formData.locationId,
        assignedEmployeeId: formData.assignedEmployeeId || undefined,
        oemSerialNumber: formData.oemSerialNumber.trim(),
        status: formData.status,
        technician: formData.technician,
        maintenanceTeam: formData.maintenanceTeam,
        workCenter: formData.workCenter,
        remarks: formData.remarks,
      };
      console.log("[SingleAsset] Creating asset with payload:", payload);
      const result = await api.createSingleAsset(payload);
      console.log("[SingleAsset] Asset created:", result);
      setSingleSuccess(`Asset "${result.assetId}" created successfully!`);
      // Reset form
      setFormData({
        equipmentId: "",
        departmentId: "",
        locationId: "",
        assignedEmployeeId: "",
        oemSerialNumber: "",
        status: "Spare",
        technician: "",
        maintenanceTeam: "",
        workCenter: "",
        remarks: "",
      });
      navigate("/assets");
    } catch (err: any) {
      console.error("[SingleAsset] Error:", err.message);
      setSingleError(err.message || "Failed to create asset.");
    } finally {
      setSingleLoading(false);
    }
  };

  // ============ Permission Check ============
  if (!isAdmin) {
    return (
      <div className="space-y-6 font-sans">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-1">Asset Import Manager</h2>
          <p className="text-xs text-slate-500">Import assets via bulk CSV/Excel upload or single asset form</p>
        </div>
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs text-center shadow-sm">
          <HelpCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <h4 className="font-bold uppercase tracking-wider mb-1">Upload Clearance Denied</h4>
          Import functionality is restricted to Admin role credentials. Sign out and log in with admin accounts.
        </div>
      </div>
    );
  }

  return (
    <div id="import-dashboard-wrapper" className="space-y-6 font-sans">

      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-1">Asset Import Manager</h2>
        <p className="text-xs text-slate-500">Bulk import via CSV/Excel or create a single asset record</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-0">
        <button
          onClick={() => setActiveTab("bulk")}
          className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase transition-all duration-150 border-b-2 cursor-pointer ${
            activeTab === "bulk"
              ? "border-teal-500 text-teal-700 bg-teal-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <UploadCloud className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
          Bulk Import
        </button>
        <button
          onClick={() => setActiveTab("single")}
          className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase transition-all duration-150 border-b-2 cursor-pointer ${
            activeTab === "single"
              ? "border-teal-500 text-teal-700 bg-teal-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <PlusCircle className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
          Single Import
        </button>
      </div>

      {/* ==================== BULK IMPORT TAB ==================== */}
      {activeTab === "bulk" && (
        <div className="space-y-6">

          {/* Sample Template Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Sample Bulk Upload Template</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Download a ready-made CSV file and review the expected column structure before uploading.
                </p>
              </div>
              <a
                href="/sample-assets-import.csv"
                download="sample-assets-import.csv"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-xs font-bold uppercase rounded-xl shadow-sm hover:bg-teal-700 transition"
              >
                <FileUp className="h-3.5 w-3.5" />
                Download Sample CSV
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
              <div className="rounded-xl bg-white border border-slate-200 p-3">
                <p className="font-semibold text-slate-700 mb-2">Required columns</p>
                <p className="leading-snug">equipmentCode, departmentCode, locationCode, serial, employeeId, status</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-3">
                <p className="font-semibold text-slate-700 mb-2">Optional columns</p>
                <p className="leading-snug">technician, maintenanceTeam, workCenter, remarks</p>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Upload CSV or Excel File</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Supports .csv, .xlsx, .xls</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 transition-colors">
                <FileUp className="h-6 w-6 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-600 block truncate">
                    {fileName ? fileName : "Click to select file..."}
                  </span>
                  <span className="text-[10px] text-slate-400">CSV or Excel (.xlsx / .xls)</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {fileRows && fileRows.length > 0 && (
                <button
                  onClick={handleMapFileRows}
                  className="px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
                >
                  Verify & Map Rows
                </button>
              )}
            </div>

            {fileRows && fileRows.length > 0 && (
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                <span className="font-bold text-indigo-600">{fileRows.length}</span> records loaded from <span className="font-mono text-slate-700">{fileName}</span>
                {parsedRows.length > 0 && <span className="ml-2 text-emerald-600">→ Mapped & ready for review below</span>}
              </div>
            )}
          </div>

          {/* Or Divider */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-bold">
            <div className="flex-1 border-t border-slate-200" />
            <span>OR PASTE CSV TEXT</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Paste CSV Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                <span className="text-xs font-bold text-slate-700">Raw CSV Input</span>
              </div>
              <button
                type="button"
                onClick={loadExampleSeedCsv}
                className="text-[10px] text-teal-600 hover:text-teal-700 hover:underline transition font-mono font-bold"
              >
                Load Example
              </button>
            </div>

            <textarea
              id="bulk-import-sheet-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="equipmentCode,departmentCode,locationCode,serial,employeeId,status&#10;LT,IT,TGH-FB-B1-1F,SN-EXAMPLE-001,EMP001,Active"
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-4 h-48 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 resize-none leading-relaxed shadow-inner"
            />

            <div className="flex gap-3">
              <button
                id="parse-csv-layout-btn"
                onClick={handleParseCsv}
                className="flex-1 py-2.5 bg-white text-xs font-bold text-teal-600 border border-slate-200 hover:border-teal-400 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-2 shadow-sm"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Parse & Pre-Map Text</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          {bulkSuccess && (
            <div className="text-xs p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              {bulkSuccess}
            </div>
          )}
          {bulkError && (
            <div className="text-xs p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-semibold flex items-start gap-2">
              <X className="h-4 w-4 mt-0.5 shrink-0" />
              {bulkError}
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Parsed Records Preview ({parsedRows.length} rows)
              </h3>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 divide-y divide-slate-200 mb-4">
                <div className="sticky top-0 bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 py-2 flex border-b border-slate-200">
                  <span className="w-10 shrink-0">#</span>
                  <span className="w-20 shrink-0">Equip</span>
                  <span className="w-16 shrink-0">Dept</span>
                  <span className="w-20 shrink-0">Location</span>
                  <span className="flex-1 min-w-0">Serial</span>
                  <span className="w-14 shrink-0 text-right">Status</span>
                </div>
                {parsedRows.slice(0, 50).map((row, idx) => {
                  const eq = (row.equipment_code || row.equipmentcode || row.equipmentCode || row.equipment || "").toString().toUpperCase().slice(0, 10);
                  const dept = (row.department_code || row.departmentcode || row.departmentCode || row.department || "").toString().toUpperCase().slice(0, 8);
                  const loc = (row.location_code || row.locationcode || row.locationCode || row.location || "").toString().toUpperCase().slice(0, 12);
                  const serial = (row.serial || row.oem_serial || row.oemserial || row.oem_serial_number || row.oemSerialNumber || "").toString().slice(0, 20);
                  const status = (row.status || "Spare").toString();
                  return (
                    <div key={idx} className="px-3 py-2 flex items-center text-[11px] font-mono text-slate-700 hover:bg-slate-100/50">
                      <span className="w-10 shrink-0 text-slate-400">{idx + 1}</span>
                      <span className="w-20 shrink-0 truncate font-semibold">{eq}</span>
                      <span className="w-16 shrink-0 truncate">{dept}</span>
                      <span className="w-20 shrink-0 truncate">{loc}</span>
                      <span className="flex-1 min-w-0 truncate text-slate-500">{serial}</span>
                      <span className="w-14 shrink-0 text-right">{status}</span>
                    </div>
                  );
                })}
                {parsedRows.length > 50 && (
                  <div className="px-3 py-2 text-[10px] text-slate-400 text-center italic">
                    ... and {parsedRows.length - 50} more rows
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-slate-50 border-t border-slate-200 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <span className="text-[10px] text-slate-500 font-medium">
                  <span className="font-mono text-emerald-600 font-bold">{parsedRows.length}</span> records ready
                </span>
                <button
                  id="confirm-batch-upload-btn"
                  onClick={handleBulkUpload}
                  disabled={bulkLoading || parsedRows.length === 0}
                  className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 cursor-pointer disabled:opacity-45 flex items-center gap-2"
                >
                  {bulkLoading ? (
                    <>Processing...</>
                  ) : (
                    <><UploadCloud className="h-4 w-4" /> Commit Valid Rows</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* No rows state */}
          {parsedRows.length === 0 && !bulkSuccess && !bulkError && !fileRows && (
            <div className="text-center py-12 text-slate-400 text-xs italic font-sans bg-white border border-slate-200 rounded-2xl">
              <UploadCloud className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              Upload a CSV/Excel file or paste CSV text, then parse to preview records before committing.
            </div>
          )}
        </div>
      )}

      {/* ==================== SINGLE IMPORT TAB ==================== */}
      {activeTab === "single" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
              <PlusCircle className="h-5 w-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">Create Single Asset Record</h3>
            </div>

            {/* Success/Error messages */}
            {singleSuccess && (
              <div className="mb-4 text-xs p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {singleSuccess}
              </div>
            )}
            {singleError && (
              <div className="mb-4 text-xs p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-semibold flex items-start gap-2">
                <X className="h-4 w-4 mt-0.5 shrink-0" />
                {singleError}
              </div>
            )}

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              {/* Row 1: Equipment + Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Equipment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.equipmentId} 
                    title="Equipment spec master"
                    onChange={(e) => setFormData(prev => ({ ...prev, equipmentId: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                  >
                    <option value="">-- Select Equipment --</option>
                    {equipment.filter(eq => eq.activeStatus !== false).map(eq => (
                      <option key={eq._id} value={eq._id}>
                        {eq.equipmentCode} - {eq.equipmentName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.departmentId}
                    title="Department master"
                    onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.filter(d => d.activeStatus !== false && !d.isDeleted).map(d => (
                      <option key={d._id} value={d._id}>
                        {d.departmentCode} - {d.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Location + Employee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Location <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.locationId}
                    title="Location"
                    onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                  >
                    <option value="">-- Select Location --</option>
                    {locations.map(loc => (
                      <option key={loc._id} value={loc._id}>
                        {loc.locationCode} - {loc.locationName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Assigned Employee <span className="text-slate-400">(optional)</span>
                  </label>
                  <select
                    value={formData.assignedEmployeeId}
                    title="Assigned Employee (optional)"
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedEmployeeId: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                  >
                    <option value="">-- None (Spare) --</option>
                    {employees.filter(emp => emp.status === "Active").map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.employeeId} - {emp.employeeName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Serial + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    OEM Serial Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.oemSerialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, oemSerialNumber: e.target.value }))}
                    placeholder="e.g. SN-MACBOOK-001"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    title="Asset Status"
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                  >
                    <option value="Spare">Spare</option>
                    <option value="Active">Active</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Scrap">Scrap</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Technician + Maintenance Team */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Technician <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => setFormData(prev => ({ ...prev, technician: e.target.value }))}
                    placeholder="e.g. John Smith"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Maintenance Team <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.maintenanceTeam}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenanceTeam: e.target.value }))}
                    placeholder="e.g. IT Core Team"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Row 5: Work Center */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Work Center <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.workCenter}
                    onChange={(e) => setFormData(prev => ({ ...prev, workCenter: e.target.value }))}
                    placeholder="e.g. WC-01"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Remarks <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  rows={2}
                  placeholder="Additional notes about this asset..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={singleLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 cursor-pointer disabled:opacity-45 flex items-center gap-2"
                >
                  {singleLoading ? (
                    <>Creating Asset...</>
                  ) : (
                    <><PlusCircle className="h-4 w-4" /> Create Asset</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Reference Info */}
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
            <p className="font-bold mb-1">ℹ️ Asset ID Auto-Generation</p>
            <p className="text-indigo-600">
              Asset IDs are automatically generated based on the selected Department and Equipment codes
              (e.g., <span className="font-mono font-bold">TGH-IT-LT-0001</span>).
              OEM Serial Number must be unique per asset.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
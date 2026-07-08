import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Asset from "../models/Asset";
import AssetMovement from "../models/AssetMovement";

export async function getReportData(req: AuthRequest, res: Response) {
  try {
    const { type } = req.query;

    if (type === "movements") {
      const data = await AssetMovement.find({})
        .populate("fromEmployee")
        .populate("toEmployee")
        .populate("fromLocation")
        .populate("toLocation")
        .populate("movedBy", "name email");
      res.json(data);
      return;
    }

    const list = await Asset.find({})
      .populate("equipment")
      .populate("department")
      .populate("assignedEmployee")
      .populate("location");

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to gather report datasets.", error: err.message });
  }
}

// Convert dataset to raw CSV string and stream as file
export async function exportCsvReport(req: AuthRequest, res: Response) {
  try {
    const { type } = req.query;

    let csvContent = "";
    let fileName = "tgh-report.csv";

    let assetsList: any[] = [];
    let movementsList: any[] = [];

    if (type === "movements") {
      movementsList = await AssetMovement.find({})
        .populate("fromEmployee")
        .populate("toEmployee")
        .populate("fromLocation")
        .populate("toLocation")
        .populate("movedBy", "name");
    } else {
      assetsList = await Asset.find({})
        .populate("equipment")
        .populate("department")
        .populate("assignedEmployee")
        .populate("location");
    }

    if (type === "movements") {
      fileName = "tgh-movements-history.csv";
      csvContent += "Movement ID,Asset ID,From Employee,To Employee,From Location,To Location,Transfer Date,Remarks,Moved By\n";
      movementsList.forEach((m) => {
        const fromE = m.fromEmployee ? m.fromEmployee.employeeName : "N/A";
        const toE = m.toEmployee ? m.toEmployee.employeeName : "N/A";
        const fromL = m.fromLocation ? m.fromLocation.locationName : "N/A";
        const toL = m.toLocation ? m.toLocation.locationName : "N/A";
        const operator = m.movedBy ? m.movedBy.name : "System";
        const trRemarks = m.remarks ? m.remarks.replace(/"/g, '""') : "";

        csvContent += `"${m.movementId}","${m.assetId}","${fromE}","${toE}","${fromL}","${toL}","${m.transferDate.toISOString()}","${trRemarks}","${operator}"\n`;
      });
    } else {
      fileName = `tgh-assets-${type || "register"}.csv`;
      csvContent += "Asset ID,Equipment Name,Department Name,Department Code,Assigned Employee,Technician,Maintenance Team,Work Center,Location,OEM Serial,Status,Remarks,Registered Date\n";

      let filtered = assetsList;
      if (type === "department") {
        filtered = [...assetsList].sort((a, b) => String(a.departmentCode || "").localeCompare(b.departmentCode || ""));
      } else if (type === "employee") {
        filtered = [...assetsList].filter((a) => a.assignedEmployee);
      } else if (type === "location") {
        filtered = [...assetsList].sort((a, b) => String(a.location?.locationCode || "").localeCompare(b.location?.locationCode || ""));
      }

      filtered.forEach((a) => {
        const eqName = a.equipment ? a.equipment.equipmentName : a.equipmentName;
        const deptName = a.department ? a.department.departmentName : "N/A";
        const empName = a.assignedEmployee ? a.assignedEmployee.employeeName : "Unassigned / Spare";
        const locName = a.location ? a.location.locationName : "N/A";
        const remarkText = a.remarks ? a.remarks.replace(/"/g, '""') : "";

        const createdAt = a.createdAt ? new Date(a.createdAt).toISOString() : "";
        csvContent += `"${a.assetId}","${eqName}","${deptName}","${a.departmentCode}","${empName}","${a.technician || ""}","${a.maintenanceTeam || ""}","${a.workCenter || ""}","${locName}","${a.oemSerialNumber}","${a.status}","${remarkText}","${createdAt}"\n`;
      });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to compile file export.", error: err.message });
  }
}

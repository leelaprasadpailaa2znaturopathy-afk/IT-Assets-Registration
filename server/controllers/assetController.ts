import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Asset from "../models/Asset";
import Counter from "../models/Counter";
import AssetMovement from "../models/AssetMovement";
import Department from "../models/Department";
import EquipmentMaster from "../models/EquipmentMaster";
import Employee from "../models/Employee";
import Location from "../models/Location";
import { Types } from "mongoose";

async function allocateAssetIdInDb(departmentCode: string, equipmentCode: string): Promise<string> {
  const dcUpper = departmentCode.toUpperCase();
  const ecUpper = equipmentCode.toUpperCase();
  const counterId = `${dcUpper}-${ecUpper}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { lastNumber: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  const sequence = String(counter.lastNumber).padStart(4, "0");
  return `TGH-${dcUpper}-${ecUpper}-${sequence}`;
}

export async function getAllAssets(req: AuthRequest, res: Response) {
  try {
    const { keyword, departmentId, equipmentId, assignedEmployeeId, locationId, status } = req.query;
    let userEmployeeId: string | null = null;

    if (req.user && req.user.role === "User") {
      const emailLower = req.user.email.toLowerCase();
      const matchingEmployee = await Employee.findOne({ email: emailLower });
      userEmployeeId = matchingEmployee ? matchingEmployee._id.toString() : "NON_EXIST_DUMMY_EMP";
    }

    const query: any = {};
    if (userEmployeeId) {
      query.assignedEmployee = userEmployeeId;
    } else if (assignedEmployeeId) {
      query.assignedEmployee = assignedEmployeeId;
    }
    if (departmentId) query.department = departmentId;
    if (equipmentId) query.equipment = equipmentId;
    if (locationId) query.location = locationId;
    if (status) query.status = status;

    if (keyword && typeof keyword === "string") {
      const sKeyword = keyword.trim();
      query.$or = [
        { assetId: { $regex: sKeyword, $options: "i" } },
        { oemSerialNumber: { $regex: sKeyword, $options: "i" } },
        { equipmentName: { $regex: sKeyword, $options: "i" } },
        { remarks: { $regex: sKeyword, $options: "i" } },
        { technician: { $regex: sKeyword, $options: "i" } },
        { maintenanceTeam: { $regex: sKeyword, $options: "i" } },
      ];
    }

    const list = await Asset.find(query)
      .populate("equipment")
      .populate("department")
      .populate("assignedEmployee")
      .populate("location");

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load assets.", error: err.message });
  }
}

export async function getAssetDetails(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const item = await Asset.findById(id)
      .populate("equipment")
      .populate("department")
      .populate("assignedEmployee")
      .populate("location");

    if (!item) {
      res.status(404).json({ message: "Asset not found." });
      return;
    }

    if (req.user && req.user.role === "User") {
      const emailLower = req.user.email.toLowerCase();
      const matchingEmployee = await Employee.findOne({ email: emailLower });
      if (!matchingEmployee || item.assignedEmployee?.toString() !== matchingEmployee._id.toString()) {
        res.status(403).json({ message: "Access denied. This asset is not assigned to you." });
        return;
      }
    }

    res.json(item);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to retrieve asset details.", error: err.message });
  }
}

export async function createAsset(req: AuthRequest, res: Response) {
  try {
    const {
      equipmentId,
      departmentId,
      assignedEmployeeId,
      technician,
      maintenanceTeam,
      workCenter,
      locationId,
      oemSerialNumber,
      status,
      remarks,
    } = req.body;

    if (!equipmentId || !departmentId || !locationId || !oemSerialNumber) {
      res.status(400).json({ message: "Equipment, Department, Location, and OEM Serial Number are required fields." });
      return;
    }

    const dept = await Department.findById(departmentId);
    const eq = await EquipmentMaster.findById(equipmentId);
    const loc = await Location.findById(locationId);

    if (!dept || !eq || !loc) {
      res.status(404).json({ message: "Selected master entries (Department, Equipment, or Location) were not found." });
      return;
    }

    const assetId = await allocateAssetIdInDb(dept.departmentCode, eq.equipmentCode);

    const newAsset = new Asset({
      assetId,
      equipment: equipmentId,
      equipmentName: eq.equipmentName,
      equipmentCode: eq.equipmentCode,
      department: departmentId,
      departmentCode: dept.departmentCode,
      assignedEmployee: assignedEmployeeId || null,
      technician: technician || "",
      maintenanceTeam: maintenanceTeam || "",
      workCenter: workCenter || "",
      location: locationId,
      oemSerialNumber: oemSerialNumber.trim(),
      status: status || "Spare",
      remarks: remarks || "",
    });

    await newAsset.save();

    const movement = new AssetMovement({
      movementId: `MOV-${String((await AssetMovement.countDocuments()) + 1).padStart(6, "0")}`,
      assetId,
      fromEmployee: null,
      toEmployee: assignedEmployeeId || null,
      fromLocation: locationId,
      toLocation: locationId,
      transferDate: new Date(),
      remarks: "New asset registered in inventory.",
      movedBy: req.user?._id ? new Types.ObjectId(req.user._id) : undefined,
    });
    await movement.save();

    const populated = await Asset.findById(newAsset._id)
      .populate("equipment")
      .populate("department")
      .populate("assignedEmployee")
      .populate("location");

    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create asset.", error: err.message });
  }
}

export async function updateAsset(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      assignedEmployeeId,
      technician,
      maintenanceTeam,
      workCenter,
      locationId,
      oemSerialNumber,
      status,
      remarks,
    } = req.body;

    const origAsset = await Asset.findById(id);
    if (!origAsset) {
      res.status(404).json({ message: "Asset not found." });
      return;
    }

    const isEmployeeChanged = String(origAsset.assignedEmployee || "") !== String(assignedEmployeeId || "");
    const isLocationChanged = String(origAsset.location || "") !== String(locationId || "");

    if (isEmployeeChanged || isLocationChanged) {
      const movement = new AssetMovement({
        movementId: `MOV-${String((await AssetMovement.countDocuments()) + 1).padStart(6, "0")}`,
        assetId: origAsset.assetId,
        fromEmployee: origAsset.assignedEmployee || null,
        toEmployee: assignedEmployeeId || null,
        fromLocation: origAsset.location,
        toLocation: locationId || origAsset.location,
        transferDate: new Date(),
        remarks: remarks || "Asset assignment or location updated.",
        movedBy: req.user?._id ? new Types.ObjectId(req.user._id) : undefined,
      });
      await movement.save();
    }

    origAsset.assignedEmployee = assignedEmployeeId || null;
    origAsset.technician = technician !== undefined ? technician : origAsset.technician;
    origAsset.maintenanceTeam = maintenanceTeam !== undefined ? maintenanceTeam : origAsset.maintenanceTeam;
    origAsset.workCenter = workCenter !== undefined ? workCenter : origAsset.workCenter;
    if (locationId) origAsset.location = locationId;
    if (oemSerialNumber) origAsset.oemSerialNumber = oemSerialNumber.trim();
    if (status) origAsset.status = status;
    if (remarks !== undefined) origAsset.remarks = remarks;

    await origAsset.save();

    const populated = await Asset.findById(id)
      .populate("equipment")
      .populate("department")
      .populate("assignedEmployee")
      .populate("location");

    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update asset.", error: err.message });
  }
}

export async function deleteAsset(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Asset ID is required." });
      return;
    }

    const asset = await Asset.findById(id);
    if (!asset) {
      res.status(404).json({ message: "Asset not found." });
      return;
    }

    const assetIdStr = asset.assetId;
    await AssetMovement.deleteMany({ assetId: assetIdStr });
    await Asset.findByIdAndDelete(id);

    res.json({ message: `Asset ${assetIdStr} and its movements have been deleted.` });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete asset.", error: err.message });
  }
}

export async function transferAsset(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { toEmployeeId, toLocationId, remarks } = req.body;

    if (!toLocationId) {
      res.status(400).json({ message: "Target destination locationId is required." });
      return;
    }

    const asset = await Asset.findById(id);
    if (!asset) {
      res.status(404).json({ message: "Asset not found." });
      return;
    }

    const movement = new AssetMovement({
      movementId: `MOV-${String((await AssetMovement.countDocuments()) + 1).padStart(6, "0")}`,
      assetId: asset.assetId,
      fromEmployee: asset.assignedEmployee || null,
      toEmployee: toEmployeeId || null,
      fromLocation: asset.location,
      toLocation: toLocationId,
      transferDate: new Date(),
      remarks: remarks || "Asset transferred in the system.",
      movedBy: req.user?._id ? new Types.ObjectId(req.user._id) : undefined,
    });
    await movement.save();

    asset.assignedEmployee = toEmployeeId || null;
    asset.location = toLocationId;
    await asset.save();

    const populated = await Asset.findById(id)
      .populate("equipment")
      .populate("department")
      .populate("assignedEmployee")
      .populate("location");

    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to transfer asset.", error: err.message });
  }
}

export async function getAssetMovements(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);
    const searchId = asset ? asset.assetId : id;

    const movements = await AssetMovement.find({ assetId: searchId })
      .populate("fromEmployee")
      .populate("toEmployee")
      .populate("fromLocation")
      .populate("toLocation")
      .populate("movedBy", "name email role");

    res.json(movements);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load asset movement history.", error: err.message });
  }
}

export async function getAllMovements(req: AuthRequest, res: Response) {
  try {
    const list = await AssetMovement.find({})
      .populate("fromEmployee")
      .populate("toEmployee")
      .populate("fromLocation")
      .populate("toLocation")
      .populate("movedBy", "name email role");

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load movement history.", error: err.message });
  }
}

export async function bulkImportAssets(req: AuthRequest, res: Response) {
  try {
    const { items, rcvAssets } = req.body;
    const assetArray = items || rcvAssets;

    if (!Array.isArray(assetArray)) {
      res.status(400).json({ message: "Request body must contain an array of assets under key 'items' or 'rcvAssets'." });
      return;
    }

    const validationErrors: Array<{ row: number; errors: string[] }> = [];
    const validRawItems: any[] = [];

    const depts = await Department.find({ isDeleted: { $ne: true } });
    const eqs = await EquipmentMaster.find({});
    const emps = await Employee.find({});
    const locs = await Location.find({});

    for (let index = 0; index < assetArray.length; index++) {
      const rowNum = index + 1;
      const row = assetArray[index];
      const errors: string[] = [];

      const {
        departmentCode,
        equipmentCode,
        employeeId,
        locationCode,
        oemSerialNumber,
        status,
        remarks,
        technician,
        maintenanceTeam,
        workCenter,
      } = row;

      if (!departmentCode) errors.push("Department Code is missing.");
      if (!equipmentCode) errors.push("Equipment Code is missing.");
      if (!locationCode) errors.push("Location Code is missing.");
      if (!oemSerialNumber) errors.push("OEM Serial Number is missing.");

      const targetDept = depts.find((d) => d.departmentCode === String(departmentCode || "").trim().toUpperCase());
      const targetEq = eqs.find((e) => e.equipmentCode === String(equipmentCode || "").trim().toUpperCase());
      const targetLoc = locs.find((l) => l.locationCode === String(locationCode || "").trim().toUpperCase());

      if (departmentCode && !targetDept) {
        errors.push(`Department Code '${departmentCode}' does not exist.`);
      }
      if (equipmentCode && !targetEq) {
        errors.push(`Equipment Code '${equipmentCode}' does not exist.`);
      }
      if (locationCode && !targetLoc) {
        errors.push(`Location Code '${locationCode}' does not exist.`);
      }

      let targetEmp: any = null;
      if (employeeId && String(employeeId).trim() !== "") {
        targetEmp = emps.find((e) => e.employeeId === String(employeeId).trim().toUpperCase());
        if (!targetEmp) {
          errors.push(`Employee ID '${employeeId}' does not exist.`);
        }
      }

      const parsedStatus = String(status || "Spare").trim();
      const statusOptions = ["Active", "Spare", "Under Repair", "Scrap"];
      if (!statusOptions.includes(parsedStatus)) {
        errors.push(`Status '${status}' is invalid. Allowed: ${statusOptions.join(", ")}`);
      }

      if (errors.length > 0) {
        validationErrors.push({ row: rowNum, errors });
      } else {
        validRawItems.push({
          dept: targetDept,
          eq: targetEq,
          loc: targetLoc,
          emp: targetEmp,
          oemSerialNumber: String(oemSerialNumber).trim(),
          status: parsedStatus,
          remarks: remarks || "",
          technician: technician || "",
          maintenanceTeam: maintenanceTeam || "",
          workCenter: workCenter || "",
        });
      }
    }

    if (validationErrors.length > 0) {
      res.status(422).json({
        message: "Sheet validation failed before import. No records were modified.",
        validationErrors,
      });
      return;
    }

    const insertedAssets: any[] = [];
    const executionLogs: string[] = [];

    for (const item of validRawItems) {
      const assetId = await allocateAssetIdInDb(item.dept.departmentCode, item.eq.equipmentCode);

      const newAsset = new Asset({
        assetId,
        equipment: item.eq._id,
        equipmentName: item.eq.equipmentName,
        equipmentCode: item.eq.equipmentCode,
        department: item.dept._id,
        departmentCode: item.dept.departmentCode,
        assignedEmployee: item.emp ? item.emp._id : null,
        technician: item.technician,
        maintenanceTeam: item.maintenanceTeam,
        workCenter: item.workCenter,
        location: item.loc._id,
        oemSerialNumber: item.oemSerialNumber,
        status: item.status,
        remarks: item.remarks,
      });

      await newAsset.save();

      const movement = new AssetMovement({
        movementId: `MOV-${String((await AssetMovement.countDocuments()) + 1).padStart(6, "0")}`,
        assetId,
        fromEmployee: null,
        toEmployee: item.emp ? item.emp._id : null,
        fromLocation: item.loc._id,
        toLocation: item.loc._id,
        transferDate: new Date(),
        remarks: "Asset created via bulk upload.",
        movedBy: req.user?._id ? new Types.ObjectId(req.user._id) : undefined,
      });
      await movement.save();

      insertedAssets.push(newAsset);
      executionLogs.push(`Created ${assetId} (${item.oemSerialNumber})`);
    }

    res.status(201).json({
      message: `Bulk import completed successfully. Created ${insertedAssets.length} assets.`,
      count: insertedAssets.length,
      logs: executionLogs,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to import assets.", error: err.message });
  }
}

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

// Ensure seed helper when MongoDB has 0 items (only on first call)
let seedAlreadyAttempted = false;

async function ensureSeedAssets() {
  if (seedAlreadyAttempted) return;
  seedAlreadyAttempted = true;

  try {
    const count = await Asset.countDocuments();
    if (count === 0) {
      console.log("🌱 Database holds 0 assets. Seeding standard assets into MongoDB...");
      const depts = await Department.find({});
      const eqs = await EquipmentMaster.find({});
      const emps = await Employee.find({});
      const locs = await Location.find({});

      if (depts.length > 0 && eqs.length > 0 && locs.length > 0) {
        const itDept = depts.find((d) => d.departmentCode === "IT") || depts[0];
        const eleDept = depts.find((d) => d.departmentCode === "ELE") || depts[0];

        const laptopEq = eqs.find((e) => e.equipmentCode === "LT") || eqs[0];
        const hdEq = eqs.find((e) => e.equipmentCode === "HD") || eqs[0];
        const upsEq = eqs.find((e) => e.equipmentCode === "UPS") || eqs[0];

        const aliceEmp = emps.find((e) => e.employeeId === "EMP001");
        const davidEmp = emps.find((e) => e.employeeId === "EMP002");
        const sarahEmp = emps.find((e) => e.employeeId === "EMP003");

        const loc1F = locs.find((l) => l.locationCode === "TGH-FB-B1-1F") || locs[0];
        const loc2F = locs.find((l) => l.locationCode === "TGH-FB-B1-2F") || locs[0];
        const locServer = locs.find((l) => l.locationCode === "TGH-FB-B2-1F") || locs[0];

        // Initialize Counters
        await Counter.deleteMany({});
        await Counter.insertMany([
          { _id: `${itDept.departmentCode}-${laptopEq.equipmentCode}`, lastNumber: 2 },
          { _id: `${itDept.departmentCode}-${hdEq.equipmentCode}`, lastNumber: 1 },
          { _id: `${itDept.departmentCode}-${upsEq.equipmentCode}`, lastNumber: 0 },
          { _id: `${eleDept.departmentCode}-${upsEq.equipmentCode}`, lastNumber: 1 },
        ]);

        // Create assets
        const items = [
          {
            assetId: `TGH-${itDept.departmentCode}-${laptopEq.equipmentCode}-0001`,
            equipment: laptopEq._id,
            equipmentName: laptopEq.equipmentName,
            equipmentCode: laptopEq.equipmentCode,
            department: itDept._id,
              equipment: laptopEq._id,
              equipmentName: laptopEq.equipmentName,
              equipmentCode: laptopEq.equipmentCode,
              department: itDept._id,
              departmentCode: itDept.departmentCode,
              assignedEmployee: aliceEmp ? aliceEmp._id : null,
              technician: "Chris Evans",
              maintenanceTeam: "IT Core Team",
              workCenter: "WC-01",
              location: loc1F._id,
              oemSerialNumber: "SN-MAC778129",
              status: "Active",
              remarks: "Excellent hardware, issued to Product designer.",
            },
            {
              assetId: `TGH-${itDept.departmentCode}-${laptopEq.equipmentCode}-0002`,
              equipment: laptopEq._id,
              equipmentName: laptopEq.equipmentName,
              equipmentCode: laptopEq.equipmentCode,
              department: itDept._id,
              departmentCode: itDept.departmentCode,
              assignedEmployee: davidEmp ? davidEmp._id : null,
              technician: "Chris Evans",
              maintenanceTeam: "IT Core Team",
              workCenter: "WC-01",
              location: loc2F._id,
              oemSerialNumber: "SN-DELL224190",
              status: "Active",
              remarks: "Assigned for development tasks.",
            },
            {
              assetId: `TGH-${itDept.departmentCode}-${hdEq.equipmentCode}-0001`,
              equipment: hdEq._id,
              equipmentName: hdEq.equipmentName,
              equipmentCode: hdEq.equipmentCode,
              department: itDept._id,
              departmentCode: itDept.departmentCode,
              assignedEmployee: null,
              technician: "Chris Evans",
              maintenanceTeam: "Backup Support",
              workCenter: "WC-01",
              location: loc1F._id,
              oemSerialNumber: "SN-WD-RED-4TB",
              status: "Spare",
              remarks: "Stored in IT locker room.",
            },
            {
              assetId: `TGH-${eleDept.departmentCode}-${upsEq.equipmentCode}-0001`,
              equipment: upsEq._id,
              equipmentName: upsEq.equipmentName,
              equipmentCode: upsEq.equipmentCode,
              department: eleDept._id,
              departmentCode: eleDept.departmentCode,
              assignedEmployee: sarahEmp ? sarahEmp._id : null,
              technician: "Gaurav Sen",
              maintenanceTeam: "Power Grid Ops",
              workCenter: "WC-Power",
              location: locServer._id,
              oemSerialNumber: "SN-APC-2KVA-332",
              status: "Under Repair",
              remarks: "Experiencing irregular voltage drops.",
            },
          ];

          await Asset.insertMany(items);

          // Seed Movements
          await AssetMovement.deleteMany({});
          await AssetMovement.insertMany([
            {
              movementId: "MOV-000001",
              assetId: `TGH-${itDept.departmentCode}-${laptopEq.equipmentCode}-0001`,
              fromEmployee: null,
              toEmployee: aliceEmp ? aliceEmp._id : null,
              fromLocation: locServer._id,
              toLocation: loc1F._id,
              transferDate: new Date(Date.now() - 30 * 24 * 3600 * 1000),
              remarks: "Initial allocation upon employee onboarding.",
              movedBy: new Types.ObjectId("000000000000000000000001"), // reference admin user
            },
            {
              movementId: "MOV-000002",
              assetId: `TGH-${itDept.departmentCode}-${laptopEq.equipmentCode}-0002`,
              fromEmployee: aliceEmp ? aliceEmp._id : null,
              toEmployee: davidEmp ? davidEmp._id : null,
              fromLocation: loc1F._id,
              toLocation: loc2F._id,
              transferDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
              remarks: "Temporary hardware exchange for high performance GPU requirements.",
              movedBy: new Types.ObjectId("000000000000000000000001"),
            },
          ]);

          console.log("✅ Seed Assets & Movements created successfully in MongoDB.");
        }
      }
    } catch (e: any) {
      console.error("Failed to default-seed Assets & Movements series:", e.message);
    }
  }
}

// Generate Asset ID atomic sequence function
async function allocateAssetIdInDb(departmentCode: string, equipmentCode: string): Promise<string> {
  const dcUpper = departmentCode.toUpperCase();
  const ecUpper = equipmentCode.toUpperCase();
  const counterId = `${dcUpper}-${ecUpper}`;

  if (isMongoConnected()) {
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { lastNumber: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    const seqStr = String(counter.lastNumber).padStart(4, "0");
    return `TGH-${dcUpper}-${ecUpper}-${seqStr}`;
  } else {
    return store.generateAssetId(dcUpper, ecUpper);
  }
}

export async function getAllAssets(req: AuthRequest, res: Response) {
  try {
    await ensureSeedAssets();

    const { keyword, departmentId, equipmentId, assignedEmployeeId, locationId, status } = req.query;

    let userEmployeeId: string | null = null;

    // RBAC: If User role is 'User', find the employee matching this user's email
    if (req.user && req.user.role === "User") {
      const emailLower = req.user.email.toLowerCase();
      if (isMongoConnected()) {
        const matchingEmployee = await Employee.findOne({ email: emailLower });
        userEmployeeId = matchingEmployee ? matchingEmployee._id.toString() : "NON_EXIT_DUMMY_EMP";
      } else {
        const matchingEmployee = store.employees.find((e) => e.email.toLowerCase() === emailLower);
        userEmployeeId = matchingEmployee ? matchingEmployee._id : "NON_EXIT_DUMMY_EMP";
      }
    }

    if (isMongoConnected()) {
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

      // Smart global search filter keyword (Asset ID, Serial Number, Equipment Name, etc)
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
    } else {
      let filtered = [...store.assets];

      // Filters
      if (userEmployeeId) {
        filtered = filtered.filter((a) => a.assignedEmployeeId === userEmployeeId);
      } else if (assignedEmployeeId) {
        filtered = filtered.filter((a) => a.assignedEmployeeId === assignedEmployeeId);
      }

      if (departmentId) filtered = filtered.filter((a) => a.departmentId === departmentId);
      if (equipmentId) filtered = filtered.filter((a) => a.equipmentId === equipmentId);
      if (locationId) filtered = filtered.filter((a) => a.locationId === locationId);
      if (status) filtered = filtered.filter((a) => a.status === status);

      if (keyword && typeof keyword === "string") {
        const term = keyword.toLowerCase().trim();
        filtered = filtered.filter(
          (a) =>
            a.assetId.toLowerCase().includes(term) ||
            a.oemSerialNumber.toLowerCase().includes(term) ||
            a.equipmentName.toLowerCase().includes(term) ||
            a.remarks.toLowerCase().includes(term) ||
            a.technician.toLowerCase().includes(term) ||
            a.maintenanceTeam.toLowerCase().includes(term)
        );
      }

      // Populate manually
      const populated = filtered.map((item) => {
        const eq = store.equipmentMasters.find((e) => e._id === item.equipmentId);
        const dept = store.departments.find((d) => d._id === item.departmentId);
        const emp = store.employees.find((e) => e._id === item.assignedEmployeeId);
        const loc = store.locations.find((l) => l._id === item.locationId);

        return {
          ...item,
          equipment: eq || null,
          department: dept || null,
          assignedEmployee: emp || null,
          location: loc || null,
        };
      });

      res.json(populated);
    }
  } catch (err: any) {
    res.status(500).json({ message: "Failed to locate assets.", error: err.message });
  }
}

export async function getAssetDetails(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const item = await Asset.findById(id)
        .populate("equipment")
        .populate("department")
        .populate("assignedEmployee")
        .populate("location");

      if (!item) {
        res.status(404).json({ message: "Asset code not found." });
        return;
      }

      // Check access permission
      if (req.user && req.user.role === "User") {
        const emailLower = req.user.email.toLowerCase();
        const matchingEmployee = await Employee.findOne({ email: emailLower });
        if (!matchingEmployee || item.assignedEmployee?.toString() !== matchingEmployee._id.toString()) {
          res.status(403).json({ message: "Access denied. This asset is not assigned to you." });
          return;
        }
      }

      res.json(item);
    } else {
      const item = store.assets.find((a) => a._id === id || a.assetId === id);
      if (!item) {
        res.status(404).json({ message: "Asset code not found." });
        return;
      }

      if (req.user && req.user.role === "User") {
        const emailLower = req.user.email.toLowerCase();
        const matchingEmployee = store.employees.find((e) => e.email.toLowerCase() === emailLower);
        if (!matchingEmployee || item.assignedEmployeeId !== matchingEmployee._id) {
          res.status(403).json({ message: "Access denied. This asset is not assigned to you." });
          return;
        }
      }

      const eq = store.equipmentMasters.find((e) => e._id === item.equipmentId);
      const dept = store.departments.find((d) => d._id === item.departmentId);
      const emp = store.employees.find((e) => e._id === item.assignedEmployeeId);
      const loc = store.locations.find((l) => l._id === item.locationId);

      res.json({
        ...item,
        equipment: eq || null,
        department: dept || null,
        assignedEmployee: emp || null,
        location: loc || null,
      });
    }
  } catch (err: any) {
    res.status(500).json({ message: "Failed to gather asset information.", error: err.message });
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

    if (isMongoConnected()) {
      // Find objects to fetch names/codes
      const dept = await Department.findById(departmentId);
      const eq = await EquipmentMaster.findById(equipmentId);
      const loc = await Location.findById(locationId);

      if (!dept || !eq || !loc) {
        res.status(404).json({ message: "Selected Master entries (Department, Equipment, or Location) not found." });
        return;
      }

      // Generate atomic custom ID
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

      // Dispatch initial AssetMovement log
      const initialMoveMetric = new AssetMovement({
        movementId: `MOV-${String(await AssetMovement.countDocuments() + 1).padStart(6, "0")}`,
        assetId,
        fromEmployee: null,
        toEmployee: assignedEmployeeId || null,
        fromLocation: locationId, // starting space
        toLocation: locationId,
        transferDate: new Date(),
        remarks: "New asset registered in inventory.",
        movedBy: req.user?._id ? new Types.ObjectId(req.user._id) : undefined,
      });
      await initialMoveMetric.save();

      const populated = await Asset.findById(newAsset._id)
        .populate("equipment")
        .populate("department")
        .populate("assignedEmployee")
        .populate("location");

      res.status(201).json(populated);
    } else {
      const dept = store.departments.find((d) => d._id === departmentId);
      const eq = store.equipmentMasters.find((e) => e._id === equipmentId);
      const loc = store.locations.find((l) => l._id === locationId);

      if (!dept || !eq || !loc) {
        res.status(404).json({ message: "Selected Master entries (Department, Equipment, or Location) not found." });
        return;
      }

      const assetId = await allocateAssetIdInDb(dept.departmentCode, eq.equipmentCode);

      const newAsset: IAsset = {
        _id: "ast-" + (store.assets.length + 1),
        assetId,
        equipmentId,
        equipmentName: eq.equipmentName,
        equipmentCode: eq.equipmentCode,
        departmentId,
        departmentCode: dept.departmentCode,
        assignedEmployeeId: assignedEmployeeId || null,
        technician: technician || "",
        maintenanceTeam: maintenanceTeam || "",
        workCenter: workCenter || "",
        locationId,
        oemSerialNumber: oemSerialNumber.trim(),
        status: status || "Spare",
        remarks: remarks || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.assets.push(newAsset);

      // Create Movement record
      const movementId = store.generateMovementId();
      store.assetMovements.push({
        _id: "mov-" + (store.assetMovements.length + 1),
        movementId,
        assetId,
        fromEmployeeId: null,
        toEmployeeId: assignedEmployeeId || null,
        fromLocationId: locationId,
        toLocationId: locationId,
        transferDate: new Date().toISOString(),
        remarks: "New asset registered in inventory.",
        movedByUserId: req.user?._id || "u-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.status(201).json({
        ...newAsset,
        equipment: eq,
        department: dept,
        assignedEmployee: store.employees.find((e) => e._id === assignedEmployeeId) || null,
        location: loc,
      });
    }
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create asset card.", error: err.message });
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

    if (isMongoConnected()) {
      const origAsset = await Asset.findById(id);
      if (!origAsset) {
        res.status(404).json({ message: "Target asset not found." });
        return;
      }

      const isEmployeeChanged = String(origAsset.assignedEmployee || "") !== String(assignedEmployeeId || "");
      const isLocationChanged = String(origAsset.location || "") !== String(locationId || "");

      // Capture history event if transfer is identified isEmployeeChanged or isLocationChanged
      if (isEmployeeChanged || isLocationChanged) {
        const nextMoveSeq = `MOV-${String(await AssetMovement.countDocuments() + 1).padStart(6, "0")}`;
        const transaction = new AssetMovement({
          movementId: nextMoveSeq,
          assetId: origAsset.assetId,
          fromEmployee: origAsset.assignedEmployee || null,
          toEmployee: assignedEmployeeId || null,
          fromLocation: origAsset.location,
          toLocation: locationId || origAsset.location,
          transferDate: new Date(),
          remarks: remarks || "Assigned values updated in system card.",
          movedBy: req.user?._id ? new Types.ObjectId(req.user._id) : undefined,
        });
        await transaction.save();
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
    } else {
      const target = store.assets.find((a) => a._id === id || a.assetId === id);
      if (!target) {
        res.status(404).json({ message: "Target asset not found." });
        return;
      }

      const isEmployeeChanged = target.assignedEmployeeId !== (assignedEmployeeId || null);
      const isLocationChanged = target.locationId !== (locationId || target.locationId);

      if (isEmployeeChanged || isLocationChanged) {
        const movementId = store.generateMovementId();
        store.assetMovements.push({
          _id: "mov-" + (store.assetMovements.length + 1),
          movementId,
          assetId: target.assetId,
          fromEmployeeId: target.assignedEmployeeId,
          toEmployeeId: assignedEmployeeId || null,
          fromLocationId: target.locationId,
          toLocationId: locationId || target.locationId,
          transferDate: new Date().toISOString(),
          remarks: remarks || "Transfer operation parsed via Card Editor.",
          movedByUserId: req.user?._id || "u-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      target.assignedEmployeeId = assignedEmployeeId || null;
      if (technician !== undefined) target.technician = technician;
      if (maintenanceTeam !== undefined) target.maintenanceTeam = maintenanceTeam;
      if (workCenter !== undefined) target.workCenter = workCenter;
      if (locationId) target.locationId = locationId;
      if (oemSerialNumber) target.oemSerialNumber = oemSerialNumber.trim();
      if (status) target.status = status;
      if (remarks !== undefined) target.remarks = remarks;
      target.updatedAt = new Date().toISOString();

      const eq = store.equipmentMasters.find((e) => e._id === target.equipmentId);
      const dept = store.departments.find((d) => d._id === target.departmentId);
      const emp = store.employees.find((e) => e._id === target.assignedEmployeeId);
      const loc = store.locations.find((l) => l._id === target.locationId);

      res.json({
        ...target,
        equipment: eq || null,
        department: dept || null,
        assignedEmployee: emp || null,
        location: loc || null,
      });
    }
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update asset information parameters.", error: err.message });
  }
}

export async function deleteAsset(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query; // optional query param to force hard delete

    if (!id) {
      res.status(400).json({ message: "Asset ID is required." });
      return;
    }

    if (isMongoConnected()) {
      const asset = await Asset.findById(id);
      if (!asset) {
        res.status(404).json({ message: "Asset not found." });
        return;
      }

      const assetIdStr = asset.assetId;

      // Delete associated movements
      await AssetMovement.deleteMany({ assetId: assetIdStr });

      // Delete the asset itself
      await Asset.findByIdAndDelete(id);

      // Also remove from in-memory store if applicable
      const storeIdx = store.assets.findIndex((a) => a._id === id || a.assetId === id);
      if (storeIdx !== -1) {
        store.assets.splice(storeIdx, 1);
      }
      const movFiltered = store.assetMovements.filter((m) => m.assetId !== assetIdStr);
      store.assetMovements.length = 0;
      store.assetMovements.push(...movFiltered);

      res.json({ message: `Asset ${assetIdStr} and its associated movement records have been permanently deleted.` });
    } else {
      const idx = store.assets.findIndex((a) => a._id === id || a.assetId === id);
      if (idx === -1) {
        res.status(404).json({ message: "Asset not found in local store." });
        return;
      }

      const assetIdStr = store.assets[idx].assetId;

      // Remove asset
      store.assets.splice(idx, 1);

      // Remove associated movements
      const remainingMovements = store.assetMovements.filter((m) => m.assetId !== assetIdStr);
      store.assetMovements.length = 0;
      store.assetMovements.push(...remainingMovements);

      res.json({ message: `Asset ${assetIdStr} and its associated movement records have been permanently deleted from local store.` });
    }
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete asset.", error: err.message });
  }
}

export async function transferAsset(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { toEmployeeId, toLocationId, remarks } = req.body;

    if (!toLocationId) {
      res.status(400).json({ message: "Target destination locationId is required for physical transfer." });
      return;
    }

    if (isMongoConnected()) {
      const parent = await Asset.findById(id);
      if (!parent) {
        res.status(404).json({ message: "Target Asset not found." });
        return;
      }

      const nextMoveSeq = `MOV-${String(await AssetMovement.countDocuments() + 1).padStart(6, "0")}`;
      const trx = new AssetMovement({
        movementId: nextMoveSeq,
        assetId: parent.assetId,
        fromEmployee: parent.assignedEmployee || null,
        toEmployee: toEmployeeId || null,
        fromLocation: parent.location,
        toLocation: toLocationId,
        transferDate: new Date(),
        remarks: remarks || "Internal site hand-off transfer.",
        movedBy: req.user?._id ? new Types.ObjectId(req.user._id) : undefined,
      });
      await trx.save();

      parent.assignedEmployee = toEmployeeId || null;
      parent.location = toLocationId;
      await parent.save();

      const populated = await Asset.findById(id)
        .populate("equipment")
        .populate("department")
        .populate("assignedEmployee")
        .populate("location");

      res.json(populated);
    } else {
      const parent = store.assets.find((a) => a._id === id || a.assetId === id);
      if (!parent) {
        res.status(404).json({ message: "Target Asset not found." });
        return;
      }

      const movementId = store.generateMovementId();
      store.assetMovements.push({
        _id: "mov-" + (store.assetMovements.length + 1),
        movementId,
        assetId: parent.assetId,
        fromEmployeeId: parent.assignedEmployeeId,
        toEmployeeId: toEmployeeId || null,
        fromLocationId: parent.locationId,
        toLocationId: toLocationId,
        transferDate: new Date().toISOString(),
        remarks: remarks || "Internal site hand-off transfer.",
        movedByUserId: req.user?._id || "u-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      parent.assignedEmployeeId = toEmployeeId || null;
      parent.locationId = toLocationId;
      parent.updatedAt = new Date().toISOString();

      const eq = store.equipmentMasters.find((e) => e._id === parent.equipmentId);
      const dept = store.departments.find((d) => d._id === parent.departmentId);
      const emp = store.employees.find((e) => e._id === parent.assignedEmployeeId);
      const loc = store.locations.find((l) => l._id === parent.locationId);

      res.json({
        ...parent,
        equipment: eq || null,
        department: dept || null,
        assignedEmployee: emp || null,
        location: loc || null,
      });
    }
  } catch (err: any) {
    res.status(500).json({ message: "Failed to log movement transfer transaction.", error: err.message });
  }
}

export async function getAssetMovements(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // string assetId or model _id

    if (isMongoConnected()) {
      // Find asset ID
      const asset = await Asset.findById(id);
      const searchId = asset ? asset.assetId : id;

      const movements = await AssetMovement.find({ assetId: searchId })
        .populate("fromEmployee")
        .populate("toEmployee")
        .populate("fromLocation")
        .populate("toLocation")
        .populate("movedBy", "name email role");

      res.json(movements);
    } else {
      const asset = store.assets.find((a) => a._id === id || a.assetId === id);
      const searchId = asset ? asset.assetId : id;

      const filtered = store.assetMovements.filter((m) => m.assetId === searchId);

      const populated = filtered.map((m) => {
        const fromEmp = store.employees.find((e) => e._id === m.fromEmployeeId);
        const toEmp = store.employees.find((e) => e._id === m.toEmployeeId);
        const fromLoc = store.locations.find((l) => l._id === m.fromLocationId);
        const toLoc = store.locations.find((l) => l._id === m.toLocationId);
        const userObj = store.users.find((u) => u._id === m.movedByUserId);

        return {
          ...m,
          fromEmployee: fromEmp || null,
          toEmployee: toEmp || null,
          fromLocation: fromLoc || null,
          toLocation: toLoc || null,
          movedBy: userObj ? { name: userObj.name, email: userObj.email, role: userObj.role } : null,
        };
      });

      res.json(populated);
    }
  } catch (err: any) {
    res.status(500).json({ message: "Failed to extract movement history details.", error: err.message });
  }
}

export async function getAllMovements(req: AuthRequest, res: Response) {
  try {
    if (isMongoConnected()) {
      const list = await AssetMovement.find({})
        .populate("fromEmployee")
        .populate("toEmployee")
        .populate("fromLocation")
        .populate("toLocation")
        .populate("movedBy", "name email");

      res.json(list);
    } else {
      const populated = store.assetMovements.map((m) => {
        const fromEmp = store.employees.find((e) => e._id === m.fromEmployeeId);
        const toEmp = store.employees.find((e) => e._id === m.toEmployeeId);
        const fromLoc = store.locations.find((l) => l._id === m.fromLocationId);
        const toLoc = store.locations.find((l) => l._id === m.toLocationId);
        const userObj = store.users.find((u) => u._id === m.movedByUserId);

        return {
          ...m,
          fromEmployee: fromEmp || null,
          toEmployee: toEmp || null,
          fromLocation: fromLoc || null,
          toLocation: toLoc || null,
          movedBy: userObj ? { name: userObj.name, email: userObj.email } : null,
        };
      });

      res.json(populated);
    }
  } catch (err: any) {
    res.status(500).json({ message: "Failed to gather global transaction logs.", error: err.message });
  }
}

// Bulk Import Validation and Import API handler
export async function bulkImportAssets(req: AuthRequest, res: Response) {
  try {
    const { items, rcvAssets } = req.body; // Array of objects
    const assetArray = items || rcvAssets;

    if (!assetArray || !Array.isArray(assetArray)) {
      res.status(400).json({ message: "Request body must contain an array of assets under key 'items' or 'rcvAssets'." });
      return;
    }

    const validationErrors: Array<{ row: number; errors: string[] }> = [];
    const validRawItems: any[] = [];

    // Fetch master references for validation checks
    let depts: any[] = [];
    let eqs: any[] = [];
    let emps: any[] = [];
    let locs: any[] = [];

    if (isMongoConnected()) {
      depts = await Department.find({ isDeleted: { $ne: true } });
      eqs = await EquipmentMaster.find({});
      emps = await Employee.find({});
      locs = await Location.find({});
    } else {
      depts = store.departments.filter((d) => !d.isDeleted);
      eqs = store.equipmentMasters;
      emps = store.employees;
      locs = store.locations;
    }

    // Process row item schemas
    for (let index = 0; index < assetArray.length; index++) {
      const rowNum = index + 1;
      const row = assetArray[index];
      const errors: string[] = [];

      const {
        departmentCode,
        equipmentCode,
        employeeId, // optional
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

      // Check master existence
      const targetDept = depts.find((d) => d.departmentCode === String(departmentCode || "").trim().toUpperCase());
      const targetEq = eqs.find((e) => e.equipmentCode === String(equipmentCode || "").trim().toUpperCase());
      const targetLoc = locs.find((l) => l.locationCode === String(locationCode || "").trim().toUpperCase());

      if (departmentCode && !targetDept) {
        errors.push(`Department Code '${departmentCode}' does not exist in Masters list.`);
      }
      if (equipmentCode && !targetEq) {
        errors.push(`Equipment Code '${equipmentCode}' does not exist in Masters list.`);
      }
      if (locationCode && !targetLoc) {
        errors.push(`Location Code '${locationCode}' does not exist in Masters list.`);
      }

      let targetEmp: any = null;
      if (employeeId && String(employeeId).trim() !== "") {
        targetEmp = emps.find((e) => e.employeeId === String(employeeId).trim().toUpperCase());
        if (!targetEmp) {
          errors.push(`Employee ID '${employeeId}' does not exist in Employee Records.`);
        }
      }

      // Validate status options
      const parsedStatus = String(status || "Spare").trim();
      const statusOptions = ["Active", "Spare", "Under Repair", "Scrap"];
      if (!statusOptions.includes(parsedStatus)) {
        errors.push(`Status value '${status}' is invalid. Allowed: ${statusOptions.join(", ")}`);
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

    // Secure actual insertion sequence
    const insertedAssets: any[] = [];
    const executionLogs: string[] = [];

    for (const item of validRawItems) {
      const assetId = await allocateAssetIdInDb(item.dept.departmentCode, item.eq.equipmentCode);

      if (isMongoConnected()) {
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

        const mv = new AssetMovement({
          movementId: `MOV-${String(await AssetMovement.countDocuments() + 1).padStart(6, "0")}`,
          assetId,
          fromEmployee: null,
          toEmployee: item.emp ? item.emp._id : null,
          fromLocation: item.loc._id,
          toLocation: item.loc._id,
          remarks: "Asset created via xlsx file bulk excel upload.",
          movedBy: req.user?._id ? new Types.ObjectId(req.user._id) : undefined,
        });
        await mv.save();

        insertedAssets.push(newAsset);
      } else {
        const newAsset: IAsset = {
          _id: "ast-" + (store.assets.length + 1),
          assetId,
          equipmentId: item.eq._id,
          equipmentName: item.eq.equipmentName,
          equipmentCode: item.eq.equipmentCode,
          departmentId: item.dept._id,
          departmentCode: item.dept.departmentCode,
          assignedEmployeeId: item.emp ? item.emp._id : null,
          technician: item.technician,
          maintenanceTeam: item.maintenanceTeam,
          workCenter: item.workCenter,
          locationId: item.loc._id,
          oemSerialNumber: item.oemSerialNumber,
          status: item.status,
          remarks: item.remarks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        store.assets.push(newAsset);

        const movementId = store.generateMovementId();
        store.assetMovements.push({
          _id: "mov-" + (store.assetMovements.length + 1),
          movementId,
          assetId,
          fromEmployeeId: null,
          toEmployeeId: item.emp ? item.emp._id : null,
          fromLocationId: item.loc._id,
          toLocationId: item.loc._id,
          transferDate: new Date().toISOString(),
          remarks: "Asset created via xlsx file bulk excel upload.",
          movedByUserId: req.user?._id || "u-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        insertedAssets.push(newAsset);
      }

      executionLogs.push(`Generated sequence ${assetId} with Serial ${item.oemSerialNumber}`);
    }

    res.status(201).json({
      message: `Bulk Import sequence executed successfully! Created ${insertedAssets.length} asset entries.`,
      logs: executionLogs,
      count: insertedAssets.length,
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred during bulk imports.", error: err.message });
  }
}
export { ensureSeedAssets };

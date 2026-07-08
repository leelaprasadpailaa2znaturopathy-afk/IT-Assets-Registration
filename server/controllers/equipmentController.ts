import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import EquipmentMaster from "../models/EquipmentMaster";

export async function getAllEquipment(req: AuthRequest, res: Response) {
  try {
    const equipment = await EquipmentMaster.find({});
    res.json(equipment);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch equipment master database.", error: err.message });
  }
}

export async function createEquipment(req: AuthRequest, res: Response) {
  try {
    const { equipmentName, equipmentCode, category, activeStatus } = req.body;

    if (!equipmentName || !equipmentCode || !category) {
      res.status(400).json({ message: "Equipment Name, Code, and Category are required." });
      return;
    }

    const codeUpper = equipmentCode.trim().toUpperCase();

    const duplicate = await EquipmentMaster.findOne({ equipmentCode: codeUpper });
    if (duplicate) {
      res.status(400).json({ message: `Equipment code '${codeUpper}' already exists.` });
      return;
    }

    const newEq = new EquipmentMaster({
      equipmentName: equipmentName.trim(),
      equipmentCode: codeUpper,
      category: category.trim(),
      activeStatus: activeStatus !== undefined ? activeStatus : true,
    });
    await newEq.save();
    res.status(201).json(newEq);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create equipment code.", error: err.message });
  }
}

export async function updateEquipment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { equipmentName, equipmentCode, category, activeStatus } = req.body;

    if (!equipmentName || !equipmentCode || !category) {
      res.status(400).json({ message: "Equipment Name, Code, and Category are required for updates." });
      return;
    }

    const codeUpper = equipmentCode.trim().toUpperCase();

    const duplicate = await EquipmentMaster.findOne({
      equipmentCode: codeUpper,
      _id: { $ne: id },
    });
    if (duplicate) {
      res.status(400).json({ message: `Equipment code '${codeUpper}' is already in use.` });
      return;
    }

    const updated = await EquipmentMaster.findByIdAndUpdate(
      id,
      {
        equipmentName: equipmentName.trim(),
        equipmentCode: codeUpper,
        category: category.trim(),
        activeStatus: activeStatus !== undefined ? activeStatus : true,
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      res.status(404).json({ message: "Equipment code not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update equipment model.", error: err.message });
  }
}

export async function deleteEquipment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const eq = await EquipmentMaster.findByIdAndDelete(id);
    if (!eq) {
      res.status(404).json({ message: "Equipment not found." });
      return;
    }
    res.json({ message: "Equipment master deleted successfully from database." });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete equipment master.", error: err.message });
  }
}

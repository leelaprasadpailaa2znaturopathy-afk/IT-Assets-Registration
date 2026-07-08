import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Department from "../models/Department";

export async function getAllDepartments(req: AuthRequest, res: Response) {
  try {
    const departments = await Department.find({ isDeleted: { $ne: true } });
    res.json(departments);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to locate departments.", error: err.message });
  }
}

export async function createDepartment(req: AuthRequest, res: Response) {
  try {
    const { departmentName, departmentCode, activeStatus } = req.body;

    if (!departmentName || !departmentCode) {
      res.status(400).json({ message: "Department Name and Department Code are required." });
      return;
    }

    const codeUpper = departmentCode.trim().toUpperCase();

    // Check duplicate code
    const duplicate = await Department.findOne({ departmentCode: codeUpper });
    if (duplicate) {
      if (duplicate.isDeleted) {
        duplicate.isDeleted = false;
        duplicate.departmentName = departmentName;
        duplicate.activeStatus = activeStatus !== undefined ? activeStatus : true;
        await duplicate.save();
        res.json(duplicate);
        return;
      }

      res.status(400).json({ message: `Department code '${codeUpper}' already exists.` });
      return;
    }

    const newDept = new Department({
      departmentName: departmentName.trim(),
      departmentCode: codeUpper,
      activeStatus: activeStatus !== undefined ? activeStatus : true,
    });
    await newDept.save();
    res.status(201).json(newDept);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create department.", error: err.message });
  }
}

export async function updateDepartment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { departmentName, departmentCode, activeStatus } = req.body;

    if (!departmentName || !departmentCode) {
      res.status(400).json({ message: "Department Name and Department Code are required for updates." });
      return;
    }

    const codeUpper = departmentCode.trim().toUpperCase();

    const duplicate = await Department.findOne({
      departmentCode: codeUpper,
      _id: { $ne: id },
    });
    if (duplicate) {
      res.status(400).json({ message: `Department code '${codeUpper}' is already in use.` });
      return;
    }

    const updated = await Department.findByIdAndUpdate(
      id,
      {
        departmentName: departmentName.trim(),
        departmentCode: codeUpper,
        activeStatus: activeStatus !== undefined ? activeStatus : true,
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      res.status(404).json({ message: "Department not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update department.", error: err.message });
  }
}

export async function deleteDepartment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const dept = await Department.findById(id);
    if (!dept) {
      res.status(404).json({ message: "Department not found." });
      return;
    }
    dept.isDeleted = true;
    await dept.save();
    res.json({ message: "Department deleted successfully (soft-delete)." });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete department.", error: err.message });
  }
}

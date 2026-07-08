import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Employee from "../models/Employee";
import Department from "../models/Department";

export async function getAllEmployees(req: AuthRequest, res: Response) {
  try {
    const employees = await Employee.find({}).populate("department");
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load employee list.", error: err.message });
  }
}

export async function createEmployee(req: AuthRequest, res: Response) {
  try {
    const { employeeId, employeeName, departmentId, email, status } = req.body;

    if (!employeeId || !employeeName || !departmentId || !email) {
      res.status(400).json({ message: "Employee ID, Employee Name, Department ID, and Email are required parameters." });
      return;
    }

    const trimmedId = employeeId.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    // Confirm unique ID and Email
    const duplicateId = await Employee.findOne({ employeeId: trimmedId });
    if (duplicateId) {
      res.status(400).json({ message: `Employee record with ID '${trimmedId}' already exists.` });
      return;
    }

    const duplicateEmail = await Employee.findOne({ email: trimmedEmail });
    if (duplicateEmail) {
      res.status(400).json({ message: `Employee email '${trimmedEmail}' is already registered.` });
      return;
    }

    // Check department health
    const dept = await Department.findById(departmentId);
    if (!dept) {
      res.status(404).json({ message: "Selected Master Department does not exist." });
      return;
    }

    const newEmp = new Employee({
      employeeId: trimmedId,
      employeeName: employeeName.trim(),
      department: departmentId,
      email: trimmedEmail,
      status: status || "Active",
    });
    await newEmp.save();

    const populated = await Employee.findById(newEmp._id).populate("department");
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to design new employee card.", error: err.message });
  }
}

export async function updateEmployee(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { employeeId, employeeName, departmentId, email, status } = req.body;

    if (!employeeId || !employeeName || !departmentId || !email) {
      res.status(400).json({ message: "Employee ID, Employee Name, Department ID, and Email are required for updates." });
      return;
    }

    const trimmedId = employeeId.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    const duplicateId = await Employee.findOne({ employeeId: trimmedId, _id: { $ne: id } });
    if (duplicateId) {
      res.status(400).json({ message: `Employee ID '${trimmedId}' already exists.` });
      return;
    }

    const duplicateEmail = await Employee.findOne({ email: trimmedEmail, _id: { $ne: id } });
    if (duplicateEmail) {
      res.status(400).json({ message: `Employee email '${trimmedEmail}' is already registered.` });
      return;
    }

    const deptObj = await Department.findById(departmentId);
    if (!deptObj) {
      res.status(404).json({ message: "Selected department does not exist." });
      return;
    }

    const updated = await Employee.findByIdAndUpdate(
      id,
      {
        employeeId: trimmedId,
        employeeName: employeeName.trim(),
        department: departmentId,
        email: trimmedEmail,
        status: status || "Active",
      },
      { returnDocument: 'after' }
    ).populate("department");

    if (!updated) {
      res.status(404).json({ message: "Employee parameters not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update employee details.", error: err.message });
  }
}

export async function deleteEmployee(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const deleted = await Employee.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }
    res.json({ message: "Employee deleted successfully from resource base." });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete employee sheet details.", error: err.message });
  }
}

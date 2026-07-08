import { Response } from "express";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { AuthRequest } from "../middleware/auth";
import { isMongoConnected } from "../services/dbConnector";
import User from "../models/User";

export async function resetDatabase(req: AuthRequest, res: Response) {
    try {
        // Only allow admins and super admins
        if (!req.user || !["Admin", "SuperAdmin"].includes(req.user.role)) {
            res.status(403).json({ message: "Access forbidden. Admin role required." });
            return;
        }

        if (mongoose.connection.readyState !== 1) {
            res.status(503).json({ message: "MongoDB is not connected." });
            return;
        }

        const modelNames = [
            "User",
            "Department",
            "Location",
            "EquipmentMaster",
            "Employee",
            "Asset",
            "AssetMovement",
            "Counter",
        ];

        const results: Record<string, { deletedCount: number }> = {};
        const connection = mongoose.connection;

        for (const modelName of modelNames) {
            try {
                const collection = connection.db.collection(modelName);
                const { deletedCount } = await collection.deleteMany({});
                results[modelName] = { deletedCount };
            } catch (modelErr) {
                results[modelName] = { deletedCount: 0 };
            }
        }

        return res.json({
            message: "Database reset completed successfully. All master and transactional data has been deleted.",
            deleted: results,
        });
    } catch (err: any) {
        console.error("❌ Error resetting database:", err);
        return res.status(500).json({ message: "Failed to reset database.", error: err.message });
    }
}

export async function getDbStatus(req: AuthRequest, res: Response) {
    try {
        if (!req.user || !["Admin", "SuperAdmin"].includes(req.user.role)) {
            res.status(403).json({ message: "Access forbidden. Admin role required." });
            return;
        }

        const connected = isMongoConnected();
        const dbName = mongoose.connection.db?.databaseName || "N/A";

        return res.json({
            mongoConnected: connected,
            dbName: connected ? dbName : "N/A",
            readyState: mongoose.connection.readyState,
        });
    } catch (err: any) {
        console.error("❌ Error getting DB status:", err);
        return res.status(500).json({ message: "Failed to get DB status.", error: err.message });
    }
}

export async function getAllUsers(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized." });
            return;
        }

        if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
            res.status(403).json({ message: "Access forbidden. Admin role required." });
            return;
        }

        const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 });
        res.json({ users });
    } catch (err: any) {
        console.error("❌ Error fetching users:", err);
        res.status(500).json({ message: "Failed to fetch users.", error: err.message });
    }
}

export async function createUser(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized." });
            return;
        }

        if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
            res.status(403).json({ message: "Access forbidden. Admin role required." });
            return;
        }

        const { name, email, password, role, activeStatus } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ message: "Name, email and password are required." });
            return;
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            res.status(409).json({ message: "A user with this email already exists." });
            return;
        }

        const salt = await bcryptjs.genSalt(10);
        const passwordHash = await bcryptjs.hash(password, salt);

        // Regular Admins can only create User role accounts unless they are SuperAdmin
        let assignedRole = role || "User";
        if (req.user.role !== "SuperAdmin" && (assignedRole === "Admin" || assignedRole === "SuperAdmin")) {
            res.status(403).json({ message: "Only Super Admin can assign Admin or SuperAdmin roles." });
            return;
        }

        const newUser = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: assignedRole,
            activeStatus: typeof activeStatus === "boolean" ? activeStatus : true,
        });

        const { passwordHash: _, ...safeUser } = newUser.toObject();
        res.status(201).json({ user: safeUser });
    } catch (err: any) {
        console.error("❌ Error creating user:", err);
        res.status(500).json({ message: "Failed to create user.", error: err.message });
    }
}

export async function updateUser(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized." });
            return;
        }

        if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
            res.status(403).json({ message: "Access forbidden. Admin role required." });
            return;
        }

        const { userId } = req.params;
        const { name, email, role, activeStatus } = req.body;

        if (!userId) {
            res.status(400).json({ message: "User ID is required." });
            return;
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            res.status(404).json({ message: "User not found." });
            return;
        }

        // Admins cannot modify SuperAdmin accounts
        if (targetUser.role === "SuperAdmin" && req.user.role !== "SuperAdmin") {
            res.status(403).json({ message: "Only Super Admin can modify other Super Admin accounts." });
            return;
        }

        // Admins cannot promote someone to Admin or SuperAdmin
        if (req.user.role !== "SuperAdmin" && role && (role === "Admin" || role === "SuperAdmin")) {
            res.status(403).json({ message: "Only Super Admin can assign Admin or SuperAdmin roles." });
            return;
        }

        const updatedFields: any = {};
        if (typeof name === "string") updatedFields.name = name.trim();
        if (typeof email === "string") updatedFields.email = email.toLowerCase().trim();
        if (typeof role === "string") updatedFields.role = role;
        if (typeof activeStatus === "boolean") updatedFields.activeStatus = activeStatus;

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updatedFields }, { returnDocument: 'after' }).select("-passwordHash");
        res.json({ user: updatedUser });
    } catch (err: any) {
        console.error("❌ Error updating user:", err);
        res.status(500).json({ message: "Failed to update user.", error: err.message });
    }
}

export async function deleteUser(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized." });
            return;
        }

        if (req.user.role !== "SuperAdmin") {
            res.status(403).json({ message: "Access forbidden. Only Super Admin can delete users." });
            return;
        }

        const { userId } = req.params;

        if (!userId) {
            res.status(400).json({ message: "User ID is required." });
            return;
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            res.status(404).json({ message: "User not found." });
            return;
        }

        // Prevent self-deletion
        if (targetUser._id.toString() === req.user._id) {
            res.status(400).json({ message: "You cannot delete your own account." });
            return;
        }

        await User.findByIdAndDelete(userId);
        res.json({ message: "User deleted successfully." });
    } catch (err: any) {
        console.error("❌ Error deleting user:", err);
        res.status(500).json({ message: "Failed to delete user.", error: err.message });
    }
}

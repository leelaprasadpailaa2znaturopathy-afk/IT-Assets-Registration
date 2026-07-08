import { Router } from "express";
import { authMiddleware, requireAdmin, requireSuperAdmin } from "../middleware/auth";
import * as authCtrl from "../controllers/authController";
import * as deptCtrl from "../controllers/departmentController";
import * as eqCtrl from "../controllers/equipmentController";
import * as locCtrl from "../controllers/locationController";
import * as empCtrl from "../controllers/employeeController";
import * as assetCtrl from "../controllers/assetController";
import * as dashCtrl from "../controllers/dashboardController";
import * as repCtrl from "../controllers/reportController";
import * as adminCtrl from "../controllers/adminController";
import * as userCtrl from "../controllers/userController";
import { upload, uploadMasterData } from "../controllers/uploadController";

const router = Router();

// ==========================================
// 1. Authentication Routes
// ==========================================
router.post("/auth/login", authCtrl.login);
router.post("/auth/logout", authMiddleware, authCtrl.logout);
router.get("/auth/me", authMiddleware, authCtrl.getMe);

// ==========================================
// 2. Department Master Routes
// ==========================================
router.get("/departments", authMiddleware, deptCtrl.getAllDepartments);
router.post("/departments", authMiddleware, requireAdmin, deptCtrl.createDepartment);
router.put("/departments/:id", authMiddleware, requireAdmin, deptCtrl.updateDepartment);
router.delete("/departments/:id", authMiddleware, requireAdmin, deptCtrl.deleteDepartment);

// ==========================================
// 3. Equipment Master Routes
// ==========================================
router.get("/equipment", authMiddleware, eqCtrl.getAllEquipment);
router.post("/equipment", authMiddleware, requireAdmin, eqCtrl.createEquipment);
router.put("/equipment/:id", authMiddleware, requireAdmin, eqCtrl.updateEquipment);
router.delete("/equipment/:id", authMiddleware, requireAdmin, eqCtrl.deleteEquipment);

// ==========================================
// 4. Location Master Routes
// ==========================================
router.get("/locations", authMiddleware, locCtrl.getAllLocations);
router.post("/locations", authMiddleware, requireAdmin, locCtrl.createLocation);
router.put("/locations/:id", authMiddleware, requireAdmin, locCtrl.updateLocation);
router.delete("/locations/:id", authMiddleware, requireAdmin, locCtrl.deleteLocation);

// ==========================================
// 5. Employee Master Routes
// ==========================================
router.get("/employees", authMiddleware, empCtrl.getAllEmployees);
router.post("/employees", authMiddleware, requireAdmin, empCtrl.createEmployee);
router.put("/employees/:id", authMiddleware, requireAdmin, empCtrl.updateEmployee);
router.delete("/employees/:id", authMiddleware, requireAdmin, empCtrl.deleteEmployee);

// ==========================================
// 6. Asset Management Routes
// ==========================================
router.get("/assets", authMiddleware, assetCtrl.getAllAssets);
router.get("/assets/:id", authMiddleware, assetCtrl.getAssetDetails);
router.post("/assets", authMiddleware, requireAdmin, assetCtrl.createAsset);
router.put("/assets/:id", authMiddleware, requireAdmin, assetCtrl.updateAsset);
router.delete("/assets/:id", authMiddleware, requireAdmin, assetCtrl.deleteAsset);
router.post("/assets/:id/transfer", authMiddleware, requireAdmin, assetCtrl.transferAsset);
router.get("/assets/:id/movements", authMiddleware, assetCtrl.getAssetMovements);
router.get("/movements", authMiddleware, assetCtrl.getAllMovements);

// ==========================================
// 7. Excel Import Route
// ==========================================
router.post("/assets/import", authMiddleware, requireAdmin, assetCtrl.bulkImportAssets);

// ==========================================
// 8. Dashboard Routes
// ==========================================
router.get("/dashboard/stats", authMiddleware, dashCtrl.getDashboardStats);
router.get("/dashboard/charts", authMiddleware, dashCtrl.getDashboardCharts);
router.get("/dashboard/activities", authMiddleware, dashCtrl.getRecentActivities);

// ==========================================
// 9. Reports & CSV Export Routes
// ==========================================
router.get("/reports", authMiddleware, repCtrl.getReportData);
router.get("/reports/export-csv", authMiddleware, repCtrl.exportCsvReport);

// ==========================================
// 10. Master Data Upload Route
// ==========================================
router.post("/upload/master", authMiddleware, requireAdmin, upload.single("file"), uploadMasterData as any);

// ==========================================
// 10. Admin Routes
// ==========================================
router.get("/admin/db-status", authMiddleware, requireAdmin, adminCtrl.getDbStatus);
router.delete("/admin/reset-database", authMiddleware, requireAdmin, adminCtrl.resetDatabase);

// ==========================================
// 11. User Management Routes
// ==========================================
router.get("/admin/users", authMiddleware, userCtrl.getAllUsers);
router.post("/admin/users", authMiddleware, userCtrl.createUser);
router.put("/admin/users/:userId", authMiddleware, userCtrl.updateUser);
router.delete("/admin/users/:userId", authMiddleware, requireSuperAdmin, userCtrl.deleteUser);

export default router;

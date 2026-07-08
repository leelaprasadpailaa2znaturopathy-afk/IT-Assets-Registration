import { Request, Response } from "express";
import multer from "multer";
import xlsx from "xlsx";
import Department from "../models/Department";
import EquipmentMaster from "../models/EquipmentMaster";
import Location from "../models/Location";
import Employee from "../models/Employee";

// Extend Express Request to include multer file
interface MulterRequest extends Request {
    file: Express.Multer.File;
}

// Configure multer for file uploads (store in memory for processing)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [".csv", ".xlsx", ".xls", ".json"];
        const ext = "." + file.originalname.split(".").pop()?.toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only CSV, Excel, and JSON are allowed."));
        }
    }
});

export const uploadMasterData = async (req: MulterRequest, res: Response) => {
    try {
        const file = req.file;
        const type = req.body.type || "departments";
        
        console.log("[uploadMasterData] Request received:", {
            hasFile: !!file,
            fileName: file?.originalname,
            fileSize: file?.size,
            type,
            bodyKeys: Object.keys(req.body)
        });
        
        if (!file) {
            console.error("[uploadMasterData] No file in request");
            return res.status(400).json({ message: "No file uploaded. Ensure file is attached as 'file' field in form." });
        }

        if (!type) {
            console.error("[uploadMasterData] No type specified");
            return res.status(400).json({ message: "Upload type is required (departments, equipment, locations, or employees)." });
        }

        const results: any[] = [];
        const ext = "." + file.originalname.split(".").pop()?.toLowerCase();

        if (ext === ".csv") {
            const buffer = file.buffer.toString();
            const lines = buffer.split(/\r?\n/).filter((line) => line.trim());
            if (lines.length < 2) {
                return res.status(400).json({ message: "CSV file is empty or has no data rows." });
            }
            const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(",").map((v: string) => v.trim());
                const row: any = {};
                headers.forEach((header: string, index: number) => {
                    row[header] = values[index] || "";
                });
                results.push(row);
            }
        } else if (ext === ".xlsx" || ext === ".xls") {
            const workbook = xlsx.read(file.buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            jsonData.forEach((row: any) => {
                const normalized: any = {};
                Object.keys(row).forEach((key) => {
                    normalized[key.trim().toLowerCase()] = row[key];
                });
                results.push(normalized);
            });
        } else if (ext === ".json") {
            const jsonData = JSON.parse(file.buffer.toString());
            const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
            dataArray.forEach((row: any) => {
                const normalized: any = {};
                Object.keys(row).forEach((key) => {
                    normalized[key.trim().toLowerCase()] = row[key];
                });
                results.push(normalized);
            });
        } else {
            return res.status(400).json({ message: "Unsupported file format. Use CSV, Excel, or JSON." });
        }

        if (results.length === 0) {
            console.error("[uploadMasterData] No valid data found in file");
            return res.status(400).json({ message: "No valid data found in file." });
        }

        if (type === "employees") {
            const validationError = await validateEmployeeUpload(results);
            if (validationError) {
                console.error("[uploadMasterData] Employee validation error:", validationError);
                return res.status(400).json({ message: validationError });
            }
        }

        console.log("[uploadMasterData] Starting bulk upload for", results.length, type);
        await processUpload(results, type);
        console.log("[uploadMasterData] Upload completed successfully");
        res.json({ message: `Successfully uploaded ${results.length} ${type} records.` });
    } catch (err: any) {
        console.error("[uploadMasterData] Exception error:", err.message, err.stack);
        res.status(500).json({ message: err.message || "Upload processing failed." });
    }
};

async function processUpload(data: any[], type: string) {
    if (type === "departments") {
        for (const row of data) {
            try {
                const result = await Department.findOneAndUpdate(
                    { departmentCode: row.departmentCode },
                    {
                        departmentName: row.departmentName,
                        activeStatus: row.activeStatus !== undefined ? row.activeStatus : true,
                    },
                    { upsert: true, returnDocument: 'after' }
                );
                if (!result) {
                    console.warn(`Failed to upsert department: ${row.departmentCode}`);
                }
            } catch (err: any) {
                console.error(`Error processing department ${row.departmentCode}:`, err.message);
                throw new Error(`Failed to process department ${row.departmentCode}: ${err.message}`);
            }
        }
    } else if (type === "equipment") {
        for (const row of data) {
            try {
                const result = await EquipmentMaster.findOneAndUpdate(
                    { equipmentCode: row.equipmentCode },
                    {
                        equipmentName: row.equipmentName,
                        category: row.category || "General",
                        activeStatus: row.activeStatus !== undefined ? row.activeStatus : true,
                    },
                    { upsert: true, returnDocument: 'after' }
                );
                if (!result) {
                    console.warn(`Failed to upsert equipment: ${row.equipmentCode}`);
                }
            } catch (err: any) {
                console.error(`Error processing equipment ${row.equipmentCode}:`, err.message);
                throw new Error(`Failed to process equipment ${row.equipmentCode}: ${err.message}`);
            }
        }
    } else if (type === "locations") {
        for (const row of data) {
            try {
                const result = await Location.findOneAndUpdate(
                    { locationCode: row.locationCode },
                    { locationName: row.locationName },
                    { upsert: true, returnDocument: 'after' }
                );
                if (!result) {
                    console.warn(`Failed to upsert location: ${row.locationCode}`);
                }
            } catch (err: any) {
                console.error(`Error processing location ${row.locationCode}:`, err.message);
                throw new Error(`Failed to process location ${row.locationCode}: ${err.message}`);
            }
        }
    } else if (type === "employees") {
        for (const row of data) {
            try {
                const employeeId = String(row.employeeid || row.employee_id || row.employeeId || row.employee || "").trim();
                if (!employeeId) {
                    console.warn("Skipping employee row with missing employeeId.");
                    continue;
                }

                let departmentObjectId = undefined;
                if (row.department) {
                    const department = await findDepartmentByCodeOrName(row.department);
                    if (!department) {
                        console.warn(`Department '${row.department}' not found for employee ${employeeId}. Skipping.`);
                        continue;
                    }
                    departmentObjectId = department._id;
                }

                const result = await Employee.findOneAndUpdate(
                    { employeeId },
                    {
                        employeeName: row.employeename || row.employeeName || row.name || "",
                        email: row.email || "",
                        department: departmentObjectId,
                        status: row.status || "Active",
                    },
                    { upsert: true, returnDocument: 'after' }
                );
                if (!result) {
                    console.warn(`Failed to upsert employee: ${employeeId}`);
                }
            } catch (err: any) {
                console.error(`Error processing employee:`, err.message);
                throw new Error(`Failed to process employee: ${err.message}`);
            }
        }
    }
}

async function validateEmployeeUpload(data: any[]) {
    for (let index = 0; index < data.length; index++) {
        const row = data[index];
        const rowNumber = index + 2;
        const employeeId = String(row.employeeid || row.employee_id || row.employeeId || row.employee || "").trim();
        const employeeName = String(row.employeename || row.employeeName || row.name || "").trim();
        const email = String(row.email || "").trim();
        const departmentValue = String(row.department || "").trim();

        if (!employeeId) {
            return `Row ${rowNumber} is missing required field employeeId.`;
        }
        if (!employeeName) {
            return `Row ${rowNumber} is missing required field employeeName.`;
        }
        if (!email) {
            return `Row ${rowNumber} is missing required field email.`;
        }
        if (!departmentValue) {
            return `Row ${rowNumber} is missing required field department.`;
        }

        const department = await findDepartmentByCodeOrName(departmentValue);
        if (!department) {
            return `Row ${rowNumber} references department '${departmentValue}' that does not exist.`;
        }
    }
    return null;
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findDepartmentByCodeOrName(departmentValue: string) {
    const value = String(departmentValue).trim();
    if (!value) return null;

    const codeQuery = value.toUpperCase();
    const nameQuery = new RegExp(`^${escapeRegExp(value)}$`, "i");

    return await Department.findOne({
        $or: [
            { departmentCode: codeQuery },
            { departmentName: nameQuery },
        ],
    });
}

export { upload };
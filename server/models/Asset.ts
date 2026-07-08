import { Schema, model, Types } from "mongoose";

export interface IAsset {
  assetId: string; // Auto-generated: TGH-{DepartmentCode}-{EquipmentCode}-{Sequence}
  equipment: Types.ObjectId; // Reference to EquipmentMaster
  equipmentName: string; // Cached for quick search/reports
  equipmentCode: string; // Cached for sequence & quick reports

  department: Types.ObjectId; // Reference to Department
  departmentCode: string; // Cached for sequence & quick reports

  assignedEmployee?: Types.ObjectId | null; // Non-Admin Users can view their assigned assets
  technician?: string;
  maintenanceTeam?: string;
  workCenter?: string;

  location: Types.ObjectId; // Reference to Location
  oemSerialNumber: string;
  status: "Active" | "Spare" | "Under Repair" | "Scrap";
  remarks?: string;
}

const AssetSchema = new Schema<IAsset>(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "EquipmentMaster",
      required: true,
    },
    equipmentName: { type: String, required: true, trim: true },
    equipmentCode: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    departmentCode: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    assignedEmployee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    technician: { type: String, default: "" },
    maintenanceTeam: { type: String, default: "" },
    workCenter: { type: String, default: "" },
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    oemSerialNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Spare", "Under Repair", "Scrap"],
      default: "Spare",
      index: true,
    },
    remarks: { type: String, default: "" },
  },
  { timestamps: true }
);

// Add text index for comprehensive global searches (Asset ID, OEM, equipmentName, etc)
AssetSchema.index({
  assetId: "text",
  equipmentName: "text",
  equipmentCode: "text",
  departmentCode: "text",
  oemSerialNumber: "text",
  remarks: "text",
});

export default model<IAsset>("Asset", AssetSchema);

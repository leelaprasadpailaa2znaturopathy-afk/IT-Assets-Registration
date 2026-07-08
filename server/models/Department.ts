import { Schema, model } from "mongoose";

export interface IDepartment {
  departmentName: string;
  departmentCode: string; // Unique, e.g., "IT", "ELE", "FUR"
  activeStatus: boolean;
  isDeleted: boolean; // Soft delete
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    departmentName: { type: String, required: true, trim: true },
    departmentCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    activeStatus: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure query helper or index to easily filter out deleted items
DepartmentSchema.index({ isDeleted: 1 });

export default model<IDepartment>("Department", DepartmentSchema);

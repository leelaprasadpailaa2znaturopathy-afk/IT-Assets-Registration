import { Schema, model, Types } from "mongoose";

export interface IEmployee {
  employeeId: string; // Unique ID, e.g., "EMP001"
  employeeName: string;
  department: Types.ObjectId; // References Department
  email: string;
  status: "Active" | "Inactive";
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    employeeName: { type: String, required: true, trim: true },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default model<IEmployee>("Employee", EmployeeSchema);

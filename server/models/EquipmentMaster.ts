import { Schema, model } from "mongoose";

export interface IEquipmentMaster {
  equipmentName: string;
  equipmentCode: string; // Unique, e.g., "HD", "LT", "PR"
  category: string;
  activeStatus: boolean;
}

const EquipmentMasterSchema = new Schema<IEquipmentMaster>(
  {
    equipmentName: { type: String, required: true, trim: true },
    equipmentCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    category: { type: String, required: true, trim: true },
    activeStatus: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IEquipmentMaster>("EquipmentMaster", EquipmentMasterSchema);

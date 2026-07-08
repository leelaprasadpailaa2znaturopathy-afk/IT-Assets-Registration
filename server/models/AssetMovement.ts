import { Schema, model, Types } from "mongoose";

export interface IAssetMovement {
  movementId: string; // Dynamic unique movement tracking ID
  assetId: string; // The asset ID being tracked, e.g., "TGH-IT-LT-0001"
  fromEmployee?: Types.ObjectId | null;
  toEmployee?: Types.ObjectId | null;
  fromLocation: Types.ObjectId;
  toLocation: Types.ObjectId;
  transferDate: Date;
  remarks?: string;
  movedBy: Types.ObjectId; // Reference to User who initiated transaction
}

const AssetMovementSchema = new Schema<IAssetMovement>(
  {
    movementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    assetId: {
      type: String,
      required: true,
      index: true,
    },
    fromEmployee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    toEmployee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    fromLocation: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    toLocation: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    transferDate: {
      type: Date,
      default: () => new Date(),
    },
    remarks: {
      type: String,
      default: "",
    },
    movedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IAssetMovement>("AssetMovement", AssetMovementSchema);

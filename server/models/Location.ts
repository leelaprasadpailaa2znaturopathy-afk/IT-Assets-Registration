import { Schema, model } from "mongoose";

export interface ILocation {
  locationName: string;
  locationCode: string; // Unique, e.g., "TGH-FB-B1-1F"
}

const LocationSchema = new Schema<ILocation>(
  {
    locationName: { type: String, required: true, trim: true },
    locationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default model<ILocation>("Location", LocationSchema);

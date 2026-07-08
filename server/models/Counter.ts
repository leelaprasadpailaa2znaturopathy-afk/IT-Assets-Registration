import { Schema, model } from "mongoose";

export interface ICounter {
  _id: string; // Format: "DEPCODE-EQCODE", e.g., "IT-HD"
  lastNumber: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  lastNumber: { type: Number, required: true, default: 0 },
});

export default model<ICounter>("Counter", CounterSchema);

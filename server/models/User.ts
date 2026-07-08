import { Schema, model } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: "SuperAdmin" | "Admin" | "User";
  activeStatus: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["SuperAdmin", "Admin", "User"],
      default: "User",
    },
    activeStatus: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IUser>("User", UserSchema);

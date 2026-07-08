import { Response } from "express";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "TGH_SUPER_SECRET_KEY_123";

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    const dbUser = await User.findOne({ email: trimmedEmail });
    if (!dbUser) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const userObj = {
      _id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      passwordHash: dbUser.passwordHash,
      role: dbUser.role,
      activeStatus: dbUser.activeStatus,
    };

    if (!userObj) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    if (!userObj.activeStatus) {
      res.status(403).json({ message: "Account has been deactivated. Please contact IT." });
      return;
    }

    // Compare passwords
    const isMatched = await bcryptjs.compare(password, userObj.passwordHash);
    if (!isMatched) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    // Sign Token
    const payload = {
      _id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: "Login successful.",
      token,
      user: {
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "An error occurred during login.", error: error.message });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  res.json({ message: "Logout successful." });
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    const dbUser = await User.findById(req.user._id);
    if (!dbUser) {
      res.status(404).json({ message: "User profile not found." });
      return;
    }

    const userObj = {
      _id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      activeStatus: dbUser.activeStatus,
    };

    res.json({ user: userObj });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to retrieve user session.", error: error.message });
  }
}

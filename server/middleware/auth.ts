import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "TGH_SUPER_SECRET_KEY_123";

export interface DecodedUser {
  _id: string;
  name: string;
  email: string;
  role: "SuperAdmin" | "Admin" | "User";
}

// Override Express Request's user property typing to support our full role schema
export type AuthRequest = Omit<Request, "user"> & {
  user?: DecodedUser;
};

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token = "";
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      res.status(401).json({ message: "No authorization token provided or invalid format." });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as unknown as DecodedUser;
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired authorization token." });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized. Authentication required." });
    return;
  }

  if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access forbidden. Admin role required." });
    return;
  }

  next();
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized. Authentication required." });
    return;
  }

  if (req.user.role !== "SuperAdmin") {
    res.status(403).json({ message: "Access forbidden. Super Admin role required." });
    return;
  }

  next();
}

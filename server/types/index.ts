export interface UserPayload {
  _id: string;
  name: string;
  email: string;
  role: "Admin" | "User";
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

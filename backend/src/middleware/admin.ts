import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.userRole !== "ADMIN") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return;
  }
  next();
};

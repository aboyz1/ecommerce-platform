import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma errors
  if (err.message.includes("Unique constraint")) {
    res.status(409).json({
      success: false,
      message: "Resource already exists",
    });
    return;
  }

  if (
    err.message.includes("Record to delete does not exist") ||
    err.message.includes("Record to update not found")
  ) {
    res.status(404).json({
      success: false,
      message: "Resource not found",
    });
    return;
  }

  logger.error("Unhandled error:", { message: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};

import { Response } from "express";

interface ApiResponse<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: Record<string, unknown>,
): void => {
  const response: ApiResponse<T> = { success: true };
  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
): void => {
  res.status(statusCode).json({ success: false, message });
};

export const paginate = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const paginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});

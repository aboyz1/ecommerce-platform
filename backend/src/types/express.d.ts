// Global Express type augmentation — adds userId and userRole to every Request
// so route handlers don't need to cast to AuthRequest explicitly.
declare namespace Express {
  interface Request {
    userId?: string;
    userRole?: string;
  }
}

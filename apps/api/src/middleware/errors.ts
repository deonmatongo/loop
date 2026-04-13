import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation error",
      issues: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof Error) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  res.status(500).json({ error: "Unknown error" });
}

/** Wraps async route handlers so errors propagate to errorHandler */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

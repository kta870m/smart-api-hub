import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Global Error Handler Middleware
 * Bắt tất cả lỗi được throw hoặc pass qua next(err) từ các route/middleware khác.
 * Luôn trả về response chuẩn: { "error": "message" }
 *
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Zod validation error → 400 Bad Request
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const issues = (err as any).issues ?? [];
    const message =
      issues.length > 0
        ? issues.map((e: any) => `${e.path?.join('.') || 'body'}: ${e.message}`).join(', ')
        : err.message;
    res.status(400).json({ error: message });
    return;
  }

  // JWT errors → 401 Unauthorized
  if (err instanceof TokenExpiredError) {
    res.status(401).json({ error: 'Token đã hết hạn.' });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ error: 'Token không hợp lệ.' });
    return;
  }

  // DB unique constraint violation (PostgreSQL error code 23505)
  if (err.code === '23505') {
    res.status(409).json({ error: 'Dữ liệu đã tồn tại (vi phạm ràng buộc unique).' });
    return;
  }

  // DB foreign key violation (PostgreSQL error code 23503)
  if (err.code === '23503') {
    res.status(409).json({ error: 'Dữ liệu tham chiếu không hợp lệ (vi phạm khóa ngoại).' });
    return;
  }

  // HTTP status được gán thủ công (ví dụ: err.status = 404)
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Đã xảy ra lỗi server. Vui lòng thử lại sau.';

  res.status(status).json({ error: message });
}

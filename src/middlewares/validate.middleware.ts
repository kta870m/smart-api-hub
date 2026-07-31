import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Factory middleware nhận vào một Zod schema, parse req.body,
 * nếu hợp lệ thì gọi next(), nếu không trả 400 với { error: "..." }
 *
 * NOTE: Zod v4 dùng .issues thay vì .errors
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = (result.error as any).issues ?? [];
      const message = issues
        .map((e: any) => `${e.path?.join('.') || 'body'}: ${e.message}`)
        .join(', ');
      res.status(400).json({ error: message || result.error.message });
      return;
    }

    // Gán lại req.body với dữ liệu đã được parse/coerce bởi Zod
    req.body = result.data;
    next();
  };
}

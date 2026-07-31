import { z } from 'zod';

/**
 * Schema validate cho POST /auth/register
 * NOTE: Zod v4 đã bỏ 'required_error' và 'errorMap' – dùng 'message' thay thế
 */
export const registerSchema = z.object({
  email: z
    .string({ message: 'Email là bắt buộc.' })
    .email('Email không đúng định dạng.'),
  password: z
    .string({ message: 'Password là bắt buộc.' })
    .min(6, 'Password phải có ít nhất 6 ký tự.'),
  role: z
    .enum(['user', 'admin'] as const, {
      message: "Role chỉ được là 'user' hoặc 'admin'.",
    })
    .optional(),
});

/**
 * Schema validate cho POST /auth/login
 */
export const loginSchema = z.object({
  email: z
    .string({ message: 'Email là bắt buộc.' })
    .email('Email không đúng định dạng.'),
  password: z
    .string({ message: 'Password là bắt buộc.' })
    .min(1, 'Password không được để trống.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

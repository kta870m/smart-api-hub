import { z } from 'zod';

/**
 * Schema validate cho POST /:resource (Create)
 */
export const createSchema = z
  .record(z.string(), z.unknown())
  .refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'Body không được rỗng. Phải cung cấp ít nhất 1 field.' }
  );

/**
 * Schema validate cho PUT /:resource/:id (Full Update)
 */
export const updatePutSchema = z
  .record(z.string(), z.unknown())
  .refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'Body không được rỗng. Phải cung cấp ít nhất 1 field.' }
  );

export type CreateInput = z.infer<typeof createSchema>;
export type UpdatePutInput = z.infer<typeof updatePutSchema>;

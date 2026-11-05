import { z } from 'zod';
export const catalogCommentSchema = z.object({ body: z.string().trim().min(1).max(1000) });
export const commentPageSchema = z.coerce.number().int().min(1).max(10000);
export const commentIdSchema = z.string().uuid();

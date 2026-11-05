import { z } from 'zod';
export const catalogQuerySchema = z.object({
  q: z.string().trim().max(150).default(''),
  type: z.enum(['all', 'phim-le', 'phim-bo', 'hoat-hinh', 'tv-shows']).default('all'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  category: z
    .string()
    .max(100)
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .default(''),
  country: z
    .string()
    .max(100)
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .default(''),
  year: z
    .string()
    .regex(/^$|^(19|20)\d{2}$/)
    .default(''),
  sort: z.enum(['modified.time', 'year', '_id']).default('modified.time'),
});

export const movieSlugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

import { z } from 'zod';
const text = (max) => z.string().trim().min(1).max(max);
const mediaUrl = z
  .string()
  .max(2048)
  .refine((v) => {
    if (/^\/media\/[\w\-./%]+$/.test(v) && !v.includes('..') && !/%2e|%2f|%5c/i.test(v))
      return true;
    try {
      const u = new URL(v);
      return u.protocol === 'https:' && !u.username && !u.password;
    } catch {
      return false;
    }
  }, 'Dùng URL HTTPS hoặc đường dẫn /media/ hợp lệ.');
export const registerSchema = z.object({
  name: text(80),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(128),
});
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
export const movieSchema = z
  .object({
    title: text(250),
    original: text(250),
    year: z.number().int().min(1888).max(2100),
    genre: text(100),
    country: text(100),
    rating: z.number().min(0).max(10).default(0),
    duration: z.number().int().min(1).max(10000),
    type: z.enum(['movie', 'series']),
    description: text(10000),
    director: z.string().max(250).default(''),
    cast: z.string().max(2000).default(''),
    poster: mediaUrl,
    backdrop: mediaUrl,
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    license: text(4000),
    episodeList: z
      .array(
        z.object({
          number: z.number().int().min(1).max(500),
          title: text(250),
          videoUrl: mediaUrl,
        }),
      )
      .min(1)
      .max(500),
  })
  .superRefine((m, ctx) => {
    const numbers = m.episodeList.map((e) => e.number);
    if (
      new Set(numbers).size !== numbers.length ||
      [...numbers].sort((a, b) => a - b).some((n, i) => n !== i + 1)
    )
      ctx.addIssue({ code: 'custom', message: 'Số tập phải liên tiếp từ 1 và không trùng.' });
    if (m.type === 'movie' && m.episodeList.length !== 1)
      ctx.addIssue({ code: 'custom', message: 'Phim lẻ chỉ có một tập.' });
  });
export const reviewSchema = z.object({ body: text(1000), rating: z.number().int().min(1).max(10) });
export const historySchema = z.object({
  position: z.number().finite().min(0).max(604800),
  episode: z.number().int().min(1).max(500),
});
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const e = Error(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    e.status = 400;
    throw e;
  }
  return result.data;
}

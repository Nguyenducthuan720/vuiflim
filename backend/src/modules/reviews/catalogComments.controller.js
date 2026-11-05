import { randomUUID } from 'node:crypto';
import { validate } from '../../shared/validation/schemas.js';
import { movieSlugSchema } from '../catalog/catalog.schemas.js';
import {
  catalogCommentSchema,
  commentPageSchema,
  commentIdSchema,
} from './catalogComments.schemas.js';
import { createCatalogCommentsRepository } from './catalogComments.repository.js';
export function createCatalogCommentsController(pool, client) {
  const repository = createCatalogCommentsRepository(pool);
  return {
    list: async (req, res) => {
      const slug = validate(movieSlugSchema, req.params.slug),
        page = validate(commentPageSchema, req.query.page || 1);
      const [list, count] = await Promise.all([
        repository.list(slug, 20, (page - 1) * 20),
        repository.count(slug),
      ]);
      res.json({ results: list.rows, total: Number(count.rows[0].total), page, pageSize: 20 });
    },
    create: async (req, res) => {
      const slug = validate(movieSlugSchema, req.params.slug),
        data = validate(catalogCommentSchema, req.body),
        movie = await client.detail(slug);
      await repository.create([
        randomUUID(),
        req.user.id,
        'kkphim',
        slug,
        movie.title.slice(0, 250),
        data.body,
        Date.now(),
      ]);
      res.status(201).json({ ok: true });
    },
    remove: async (req, res) => {
      const id = validate(commentIdSchema, req.params.id),
        result = await repository.remove(id, req.user.id, req.user.role === 'admin');
      if (!result.rowCount)
        return res
          .status(404)
          .json({ error: 'Không tìm thấy bình luận hoặc bạn không có quyền xóa.' });
      res.json({ ok: true });
    },
  };
}

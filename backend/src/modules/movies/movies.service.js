import { randomUUID } from 'node:crypto';
const columns = [
  'title',
  'original',
  'year',
  'genre',
  'country',
  'rating',
  'duration',
  'type',
  'description',
  'director',
  'cast',
  'poster',
  'backdrop',
  'featured',
  'published',
  'license',
];
export function movieService(pool) {
  async function hydrate(rows, privateData = false) {
    if (!rows.length) return [];
    const { rows: episodes } = await pool.query(
      'SELECT movie_id,number,title,video_url FROM episodes WHERE movie_id=ANY($1::uuid[]) ORDER BY number',
      [rows.map((r) => r.id)],
    );
    return rows.map((m) => {
      const list = episodes.filter((e) => e.movie_id === m.id);
      return {
        ...m,
        episodes: list.length,
        episodeList: list.map((e) => ({
          number: e.number,
          title: e.title,
          ...(privateData ? { videoUrl: e.video_url } : {}),
        })),
      };
    });
  }
  return {
    async list(admin = false) {
      return hydrate(
        (
          await pool.query(
            `SELECT * FROM movies ${admin ? '' : 'WHERE published=TRUE'} ORDER BY featured DESC,created_at DESC`,
          )
        ).rows,
        admin,
      );
    },
    async get(id, admin = false) {
      const { rows } = await pool.query(
        `SELECT * FROM movies WHERE id=$1 ${admin ? '' : 'AND published=TRUE'}`,
        [id],
      );
      return (await hydrate(rows, admin))[0];
    },
    async save(data, id) {
      const client = await pool.connect();
      const movieId = id || randomUUID();
      try {
        await client.query('BEGIN');
        if (id) {
          const result = await client.query(
            `UPDATE movies SET ${columns.map((k, i) => `"${k}"=$${i + 1}`).join(',')},updated_at=NOW() WHERE id=$${columns.length + 1} RETURNING id`,
            [...columns.map((k) => data[k]), id],
          );
          if (!result.rowCount) {
            const e = Error('Không tìm thấy phim.');
            e.status = 404;
            throw e;
          }
        } else
          await client.query(
            `INSERT INTO movies(id,${columns.map((k) => `"${k}"`).join(',')}) VALUES (${[movieId, ...columns].map((_, i) => `$${i + 1}`).join(',')})`,
            [movieId, ...columns.map((k) => data[k])],
          );
        await client.query('DELETE FROM episodes WHERE movie_id=$1', [movieId]);
        for (const ep of data.episodeList)
          await client.query(
            'INSERT INTO episodes(id,movie_id,number,title,video_url) VALUES ($1,$2,$3,$4,$5)',
            [randomUUID(), movieId, ep.number, ep.title, ep.videoUrl],
          );
        // A changed episode list must not leave history pointing to a removed episode.
        await client.query('DELETE FROM history WHERE movie_id=$1 AND episode>$2', [
          movieId,
          data.episodeList.length,
        ]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
      return this.get(movieId, true);
    },
  };
}

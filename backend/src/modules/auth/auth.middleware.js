import { tokenHash } from './auth.helpers.js';
export const requireAuth = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: 'Bạn cần đăng nhập để tiếp tục.' });
export const requireAdmin = (req, res, next) =>
  req.user?.role === 'admin'
    ? next()
    : res.status(403).json({ error: 'Chỉ quản trị viên được phép thực hiện.' });
export function authMiddleware(pool) {
  return async (req, res, next) => {
    try {
      const t = req.headers.cookie?.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
      if (t) {
        req.sessionToken = tokenHash(t);
        const { rows } = await pool.query(
          'SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE sessions.token=$1 AND sessions.expires>$2 AND users.disabled=FALSE',
          [req.sessionToken, Date.now()],
        );
        req.user = rows[0];
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

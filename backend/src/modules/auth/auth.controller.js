import { createAuthRepository } from './auth.repository.js';
import { randomUUID, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { tokenHash, publicUser } from './auth.helpers.js';
import { registerSchema, loginSchema, validate } from '../../shared/validation/schemas.js';
export function createAuthController(pool, secure) {
  const repository = createAuthRepository(pool);
  const cookies = { httpOnly: true, sameSite: 'lax', secure, path: '/' };
  const dummy = argon2.hash('invalid-user-password', { type: argon2.argon2id });
  async function session(res, id) {
    const t = randomBytes(32).toString('hex');
    await repository.createSession([tokenHash(t), id, Date.now() + 604800000]);
    res.cookie('session', t, { ...cookies, maxAge: 604800000 });
  }

  return {
    register: async (req, res) => {
      const d = validate(registerSchema, req.body);
      const u = { id: randomUUID(), name: d.name, email: d.email, role: 'user' };
      const password = await argon2.hash(d.password, { type: argon2.argon2id });
      await repository.createUser([u.id, u.name, u.email, password, u.role]);
      await session(res, u.id);
      res.status(201).json(publicUser(u));
    },
    login: async (req, res) => {
      const d = validate(loginSchema, req.body);
      const { rows } = await repository.findUserByEmail([d.email]);
      const u = rows[0];
      const valid = await argon2.verify(u?.password || (await dummy), d.password);
      if (!valid || !u || u.disabled)
        return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
      await session(res, u.id);
      res.json(publicUser(u));
    },
    logout: async (req, res) => {
      if (req.sessionToken) await repository.revokeSession([req.sessionToken]);
      res.clearCookie('session', cookies);
      res.json({ ok: true });
    },
    changePassword: async (req, res) => {
      const { currentPassword, newPassword } = req.body || {};
      if (
        typeof currentPassword !== 'string' ||
        typeof newPassword !== 'string' ||
        newPassword.length < 8 ||
        newPassword.length > 128 ||
        currentPassword.length > 128
      )
        return res.status(400).json({ error: 'Mật khẩu mới cần từ 8 đến 128 ký tự.' });
      if (!(await argon2.verify(req.user.password, currentPassword)))
        return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
      await repository.updatePassword([
        await argon2.hash(newPassword, { type: argon2.argon2id }),
        req.user.id,
      ]);
      await repository.revokeUserSessions([req.user.id]);
      res.clearCookie('session', cookies);
      res.json({ ok: true });
    },
  };
}

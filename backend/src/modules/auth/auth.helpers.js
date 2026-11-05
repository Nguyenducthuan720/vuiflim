import { createHash } from 'node:crypto';
export const tokenHash = (t) => createHash('sha256').update(t).digest('hex');
export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

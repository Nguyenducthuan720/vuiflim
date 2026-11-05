import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { pool, query } from '../database/pool.js';
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk);
    callback();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: process.stdin.isTTY });
try {
  const name = (await rl.question('Admin name: ')).trim();
  const email = (await rl.question('Admin email: ')).trim().toLowerCase();
  process.stdout.write('Admin password (min 12 characters, hidden): ');
  muted = true;
  const password = await rl.question('');
  muted = false;
  process.stdout.write('\n');
  if (
    !name ||
    name.length > 80 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    password.length < 12 ||
    password.length > 128
  )
    throw Error('Invalid name/email or password length.');
  await pool.query('INSERT INTO users(id,name,email,password,role) VALUES ($1,$2,$3,$4,$5)', [
    randomUUID(),
    name,
    email,
    await argon2.hash(password, { type: argon2.argon2id }),
    'admin',
  ]);
  console.log('Admin created. Sign in using the website.');
} catch (e) {
  console.error(e.code === '23505' ? 'Email already exists. No account was changed.' : e.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}

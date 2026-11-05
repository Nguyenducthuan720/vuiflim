import pg from 'pg';
if (!process.env.DATABASE_URL)
  throw new Error('DATABASE_URL is required. Run npm run setup, then configure backend/.env.');
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  ...(process.env.DATABASE_CA
    ? { ssl: { ca: process.env.DATABASE_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true } }
    : {}),
});
pool.on('error', (e) => console.error('Database pool:', e.message));
export async function query(sql, params = []) {
  let n = 0;
  const res = await pool.query(
    sql.replace(/\?/g, () => `$${++n}`),
    params,
  );
  return res.rows;
}

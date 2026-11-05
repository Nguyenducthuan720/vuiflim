import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const root = new URL('../', import.meta.url),
  composeEnv = new URL('.env', root),
  backendEnv = new URL('backend/.env', root);
if (!existsSync(composeEnv))
  writeFileSync(
    composeEnv,
    `POSTGRES_USER=vuiphim\nPOSTGRES_DB=vuiphim\nPOSTGRES_PASSWORD=${randomBytes(24).toString('hex')}\nSITE_ADDRESS=http://localhost\nAPP_ORIGIN=http://localhost\nCOOKIE_SECURE=false\n`,
    { mode: 0o600 },
  );
if (!existsSync(backendEnv)) {
  const values = Object.fromEntries(
    readFileSync(composeEnv, 'utf8')
      .split(/\r?\n/)
      .map((s) => s.match(/^([A-Z_]+)=(.*)$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
  const user = encodeURIComponent(values.POSTGRES_USER || 'vuiphim'),
    password = encodeURIComponent(values.POSTGRES_PASSWORD || ''),
    db = encodeURIComponent(values.POSTGRES_DB || 'vuiphim');
  writeFileSync(
    backendEnv,
    `PORT=3001\nHOST=127.0.0.1\nDATABASE_URL=postgresql://${user}:${password}@localhost:5432/${db}\nAPP_ORIGIN=http://localhost:5173\nCOOKIE_SECURE=false\nTRUST_PROXY_HOPS=0\n`,
    { mode: 0o600 },
  );
}
console.log(
  'Environment files are ready. Existing .env files were preserved. For an existing PostgreSQL install, edit backend/.env with its credentials.',
);

// SQL persistence boundary for the auth feature.
export function createAuthRepository(pool) {
  return {
    createSession: (parameters = []) =>
      pool.query('INSERT INTO sessions(token,user_id,expires) VALUES ($1,$2,$3)', parameters),
    createUser: (parameters = []) =>
      pool.query(
        'INSERT INTO users(id,name,email,password,role) VALUES ($1,$2,$3,$4,$5)',
        parameters,
      ),
    findUserByEmail: (parameters = []) =>
      pool.query('SELECT * FROM users WHERE email=$1', parameters),
    revokeSession: (parameters = []) =>
      pool.query('DELETE FROM sessions WHERE token=$1', parameters),
    updatePassword: (parameters = []) =>
      pool.query('UPDATE users SET password=$1 WHERE id=$2', parameters),
    revokeUserSessions: (parameters = []) =>
      pool.query('DELETE FROM sessions WHERE user_id=$1', parameters),
  };
}

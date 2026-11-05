import { useState, useEffect } from 'react';
import { api } from '../../../shared/api/httpClient.js';
export function useSession() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    let active = true;
    api('/me')
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return { user, setUser };
}

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getAuth, onIdTokenChanged, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebase';
import { requestApi } from './api';

export const auth = getAuth(firebaseApp);
const Session = createContext({ user: null, profile: null, loading: false, error: '', isAdmin: false });
export const useSession = () => useContext(Session);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const version = useRef(0);
  const load = async current => {
    const task = ++version.current;
    setUser(current); setProfile(null); setError(''); setLoading(true);
    try {
      const next = current ? await requestApi('/auth/me', { user: current }) : null;
      if (task === version.current) setProfile(next);
    } catch (failure) { if (task === version.current) setError(failure.message); }
    finally { if (task === version.current) setLoading(false); }
  };
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, load, failure => { setError(failure.message); setLoading(false); });
    return () => { version.current++; unsubscribe(); };
  }, []);
  const refresh = async () => {
    if (!auth.currentUser) return load(null);
    await auth.currentUser.reload(); await auth.currentUser.getIdToken(true);
    return load(auth.currentUser);
  };
  const logout = async () => {
    version.current++; setUser(null); setProfile(null); setError(''); setLoading(false);
    try { await signOut(auth); } catch (failure) { await load(auth.currentUser); throw failure; }
  };
  return <Session.Provider value={{ user, profile, loading, error, refresh, logout, isAdmin: profile?.role === 'admin' && user?.emailVerified === true }}>{children}</Session.Provider>;
}

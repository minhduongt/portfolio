import { useEffect, useState } from 'react';
import { GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, useSession } from './AuthProvider';
import SiteNavigation, { siteLink } from './SiteNavigation';

export default function LoginPage() {
  const session = useSession();
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => { document.title = 'Sign in — Minh Duong'; }, []);
  const action = async run => {
    setPending(true); setError(''); setNotice('');
    try { await run(); }
    catch (failure) { setError(failure.code?.startsWith('auth/') ? `Sign-in request failed (${failure.code}). Please try again.` : failure.message); }
    finally { setPending(false); }
  };
  return <div className="portfolio concept-b concept-mix"><SiteNavigation concept="mix" page="login" /><main className="content-width auth-page"><span className="eyebrow">ACCOUNT</span><h1>{session.user ? 'Your account.' : 'Welcome back.'}</h1>
    {session.loading ? <p role="status">Checking your session…</p> : session.user ? <>
      <p>{session.user.email}</p><p>{session.isAdmin ? 'Verified administrator' : session.profile?.role === 'admin' ? 'Verify your email to manage content.' : 'Signed in. This account does not have administrator access.'}</p>
      {session.isAdmin && <a className="button-primary" href={siteLink('admin')}>Open administration</a>}
      <div className="workspace-actions">{!session.user.emailVerified && <button disabled={pending} onClick={() => action(async () => { await sendEmailVerification(session.user); setNotice('Verification email sent.'); })}>Send verification email</button>}<button disabled={pending} onClick={() => action(session.refresh)}>Refresh access</button><button disabled={pending} onClick={() => action(session.logout)}>Sign out</button></div>
    </> : <><form onSubmit={event => { event.preventDefault(); action(async () => { await signInWithEmailAndPassword(auth, email.trim(), password); setPassword(''); }); }}>
      <label className="utility-field">Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></label><label className="utility-field">Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button className="button-primary" disabled={pending}>Sign in</button></form><div className="workspace-actions"><button disabled={pending} onClick={() => action(() => signInWithPopup(auth, new GoogleAuthProvider()))}>Continue with Google</button><button disabled={pending || !email.trim()} onClick={() => action(async () => { await sendPasswordResetEmail(auth, email.trim()); setNotice('If this email has an account, a reset email will be sent.'); })}>Reset password</button></div></>}
    {(error || session.error) && <p className="tool-error" role="alert">{error || session.error}</p>}{notice && <p role="status">{notice}</p>}
    <a className="button-secondary" href={siteLink()}>Back to portfolio</a></main></div>;
}

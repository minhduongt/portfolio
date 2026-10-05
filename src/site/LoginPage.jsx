import { useEffect, useRef, useState } from 'react';
import LoadingState from './LoadingState';
import { GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, useSession } from './AuthProvider';
import SiteNavigation, { siteLink, SiteFooter } from './SiteNavigation';
import { authErrorMessage } from './authMessages';

export default function LoginPage() {
  const session = useSession();
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => { document.title = 'Sign in — Minh Duong'; }, []);
  const action = async run => {
    setPending(true); setError(''); setNotice('');
    try { await run(); }
    catch (failure) { setError(authErrorMessage(failure)); }
    finally { setPending(false); }
  };
  return <div className="portfolio concept-b concept-mix"><SiteNavigation concept="mix" page="login" /><main className="content-width auth-page">
    <div className="auth-card"><aside className="auth-atmosphere" aria-label="A little space to create"><span className="eyebrow">MINH DUONG / THE WORKSPACE</span><div className="auth-orbit-art" aria-hidden="true"><span className="auth-orbit-ring" /><span className="auth-orbit-ring auth-orbit-ring--inner" /><span className="auth-orbit-moon" /></div><div><h2>A little space<br />to create.</h2><p>Ideas in the notebook.<br />Useful things on the workbench.</p></div><span className="auth-art-caption">THOUGHTFUL INTERFACES. PRACTICAL SOFTWARE.</span></aside>
    <div className="auth-form-panel"><span className="eyebrow">{session.user ? 'YOUR WORKSPACE' : 'ACCOUNT ACCESS'}</span><h1>{session.user ? 'Your account.' : 'Welcome back.'}</h1><p className="auth-intro">{session.user ? 'Manage your account and access.' : 'Sign in to access your workspace.'}</p>
    {session.loading ? <LoadingState label="Checking your session" compact /> : session.user ? <>
      <p>{session.user.email}</p><p>{session.isAdmin ? 'Verified administrator' : session.error ? 'You are signed in. Your access details are temporarily unavailable.' : session.profile?.role === 'admin' ? 'Verify your email to manage content.' : 'Good to see you.'}</p>
      {!session.isAdmin && !session.error && <p className="account-access-detail">You are able to explore members-only content</p>}
      {!session.isAdmin && <div className="account-content-links"><a className="button-secondary" href={siteLink('blogs')}>Explore blogs ↗</a><a className="button-secondary" href={siteLink('tools')}>Open tools ↗</a></div>}
      {session.isAdmin && <a className="button-primary" href={siteLink('admin')}>Open administration</a>}
      <div className="workspace-actions">{!session.user.emailVerified && <button disabled={pending} onClick={() => action(async () => { await sendEmailVerification(session.user); setNotice('Verification email sent.'); })}>Send verification email</button>}<button disabled={pending} onClick={() => action(session.refresh)}>Refresh access</button><button disabled={pending} onClick={() => action(session.logout)}>Sign out</button></div>
    </> : <><form aria-busy={pending} onSubmit={event => { event.preventDefault(); action(async () => { await signInWithEmailAndPassword(auth, email.trim(), password); setPassword(''); }); }}>
      <label className="utility-field">Email<input ref={emailRef} type="email" autoComplete="username" placeholder="you@example.com" required disabled={pending} value={email} onChange={event => setEmail(event.target.value)} /></label>
      <div className="auth-password"><label className="utility-field">Password<input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required disabled={pending} value={password} onChange={event => setPassword(event.target.value)} /></label><button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div>
      <button className="auth-reset" type="button" disabled={pending || !email.trim()} onClick={() => { if (!emailRef.current?.reportValidity()) return; action(async () => { await sendPasswordResetEmail(auth, email.trim()); setNotice('If this email has an account, a reset email will be sent.'); }); }}>Reset password</button>
      <button className="button-primary auth-submit" disabled={pending}>{pending ? 'Please wait…' : 'Sign in'}<span aria-hidden="true">↗</span></button></form>
      <div className="auth-divider"><span>or continue with</span></div><button className="auth-google" disabled={pending} onClick={() => action(() => signInWithPopup(auth, new GoogleAuthProvider()))}><span className="google-mark" aria-hidden="true">G</span>Continue with Google</button></>}
    {(error || session.error) && <div className="auth-message auth-message--error" role="alert"><strong>{error ? 'Unable to complete request' : 'Account access unavailable'}</strong><p>{error || session.error}</p></div>}{notice && <div className="auth-message" role="status"><p>{notice}</p></div>}
    <a className="auth-back" href={siteLink()}>← Back to portfolio</a></div></div></main><SiteFooter /></div>;
}

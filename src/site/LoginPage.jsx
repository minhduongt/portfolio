import { useLanguage } from '../i18n/LanguageProvider';
import { localizeInvalidField, clearFieldValidation } from '../i18n/formValidation';
import { useEffect, useRef, useState } from 'react';
import LoadingState from './LoadingState';
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { requestApi } from './api';
import { auth, useSession } from './AuthProvider';
import SiteNavigation, { siteLink, SiteFooter } from './SiteNavigation';
import { authErrorMessage } from './authMessages';

export default function LoginPage() {
  const { t } = useLanguage();
  const session = useSession();
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin'), [confirmation, setConfirmation] = useState('');
  const signup = mode === 'signup';
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const pendingAction = useRef(false);
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => { document.title = t(signup ? 'Sign up — Minh Duong' : 'Sign in — Minh Duong'); }, [signup, t]);
  const action = async run => {
    if (pendingAction.current) return;
    pendingAction.current = true;
    setPending(true); setError(''); setNotice('');
    try { await run(); }
    catch (failure) { setError(authErrorMessage(failure)); }
    finally { pendingAction.current = false; setPending(false); }
  };
  const changeMode = next => { if (next === mode) return; setMode(next); setPassword(''); setConfirmation(''); setShowPassword(false); setError(''); setNotice(''); };
  const submit = event => {
    event.preventDefault();
    if (signup && password.length < 6) { setError('Use at least 6 characters for your password.'); return; }
    if (signup && password !== confirmation) { setError('Passwords do not match.'); return; }
    action(async () => {
      if (signup) {
        const registered = await requestApi('/auth/signup', { method: 'POST', body: { email: email.trim(), password }, cache: 'no-store' });
        // Backend creates the account and sends verification. Establish the same
        // Firebase SDK session used by Google and existing email sign-in.
        setMode('signin'); setPassword(''); setConfirmation('');
        setNotice(registered.verificationEmailSent ? 'Account created. Check your inbox to verify your email.' : 'Your account was created, but the verification email could not be sent. You can resend it from your account.');
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    });
  };
  return <div className="portfolio concept-b concept-mix"><SiteNavigation concept="mix" page="login" /><main className="content-width auth-page">
    <div className="auth-card"><aside className="auth-atmosphere" aria-label={t("A little space to create")}><span className="eyebrow">{t("MINH DUONG / THE WORKSPACE")}</span><div className="auth-orbit-art" aria-hidden="true"><span className="auth-orbit-ring" /><span className="auth-orbit-ring auth-orbit-ring--inner" /><span className="auth-orbit-moon" /></div><div><h2>{t("A little space")}<br />{t("to create.")}</h2><p>{t("Ideas in the notebook.")}<br />{t("Useful things on the workbench.")}</p></div><span className="auth-art-caption">{t("THOUGHTFUL INTERFACES. PRACTICAL SOFTWARE.")}</span></aside>
    <div className="auth-form-panel"><span className="eyebrow">{session.user ? t("YOUR WORKSPACE") : t("ACCOUNT ACCESS")}</span><h1>{session.user ? t("Your account.") : t(signup ? 'Create your account.' : "Welcome back.")}</h1><p className="auth-intro">{session.user ? t("Manage your account and access.") : t(signup ? 'Sign up with email and password, or continue with Google.' : "Sign in to access your workspace.")}</p>
    {session.loading ? <LoadingState label={t("Checking your session")} compact /> : session.user ? <>
      <p>{session.user.email}</p><p>{session.isAdmin ? t("Verified administrator") : session.error ? t("You are signed in. Your access details are temporarily unavailable.") : session.profile?.role === 'admin' ? t("Verify your email to manage content.") : t("Good to see you.")}</p>
      {!session.isAdmin && !session.error && <p className="account-access-detail">{t("You are able to explore members-only content")}</p>}
      {!session.isAdmin && <div className="account-content-links"><a className="button-secondary" href={siteLink('blogs')}>{t("Explore blogs ↗")}</a><a className="button-secondary" href={siteLink('tools')}>{t("Open tools ↗")}</a></div>}
      {session.isAdmin && <a className="button-primary" href={siteLink('admin')}>{t("Open administration")}</a>}
      <div className="workspace-actions">{!session.user.emailVerified && <button disabled={pending} onClick={() => action(async () => { const result = await requestApi('/auth/resend-verification', { method: 'POST', user: session.user, body: {} }); if (result.emailVerified) { await session.refresh(); setNotice('Your email is already verified.'); } else setNotice('Verification email sent.'); })}>{t("Send verification email")}</button>}<button disabled={pending} onClick={() => action(session.refresh)}>{t("Refresh access")}</button><button disabled={pending} onClick={() => action(session.logout)}>{t("Sign out")}</button></div>
    </> : <><div className="auth-mode-switch" role="group" aria-label={t('Account access')}><button type="button" disabled={pending} aria-label={t('Sign in with email')} aria-pressed={!signup} onClick={() => changeMode('signin')}>{t('Sign in')}</button><button type="button" disabled={pending} aria-pressed={signup} onClick={() => changeMode('signup')}>{t('Sign up')}</button></div><form aria-label={t(signup ? 'Create account' : 'Sign in with email')} aria-busy={pending} onInvalid={event => localizeInvalidField(event, t)} onInput={clearFieldValidation} onSubmit={submit}>
      <label className="utility-field">{t("Email")}<input ref={emailRef} type="email" autoComplete="username" maxLength={254} placeholder="you@example.com" required disabled={pending} value={email} onChange={event => setEmail(event.target.value)} /></label>
      <div className="auth-password"><label className="utility-field">{t("Password")}<input type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} maxLength={4096} placeholder={t(signup ? 'Create a password' : "Enter your password")} aria-describedby={signup ? 'signup-password-hint' : undefined} required disabled={pending} value={password} onChange={event => setPassword(event.target.value)} /></label><button className="password-toggle" type="button" disabled={pending} aria-label={showPassword ? t("Hide password") : t("Show password")} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? t("Hide") : t("Show")}</button></div>
      {signup ? <><p id="signup-password-hint" className="signup-password-hint">{t('Use at least 6 characters. A stronger password may be required by the account policy.')}</p><label className="utility-field">{t('Confirm password')}<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={4096} placeholder={t('Enter your password again')} required disabled={pending} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label></> : <button className="auth-reset" type="button" disabled={pending || !email.trim()} onClick={() => { if (!emailRef.current?.reportValidity()) return; action(async () => { await sendPasswordResetEmail(auth, email.trim()); setNotice('If this email has an account, a reset email will be sent.'); }); }}>{t("Reset password")}</button>}
      <button className="button-primary auth-submit" disabled={pending}>{pending ? t("Please wait…") : t(signup ? 'Create account' : "Sign in")}<span aria-hidden="true">↗</span></button></form>
      <div className="auth-divider"><span>{t("or continue with")}</span></div><button className="auth-google" disabled={pending} onClick={() => action(() => signInWithPopup(auth, new GoogleAuthProvider()))}><span className="google-mark" aria-hidden="true">G</span>{t("Continue with Google")}</button></>}
    {(error || session.error) && <div className="auth-message auth-message--error" role="alert"><strong>{error ? t("Unable to complete request") : t("Account access unavailable")}</strong><p>{t(error || session.error)}</p></div>}{notice && <div className="auth-message" role="status"><p>{t(notice)}</p></div>}
    <a className="auth-back" href={siteLink()}>{t("← Back to portfolio")}</a></div></div></main><SiteFooter /></div>;
}

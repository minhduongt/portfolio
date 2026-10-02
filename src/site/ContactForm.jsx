import { useRef, useState } from 'react';
import { requestApi } from './api';
import { profile } from './content';

export default function ContactForm() {
  const [state, setState] = useState({});
  const pending = useRef(false);
  const submit = async event => {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const body = Object.fromEntries(['name', 'email', 'phone', 'message'].map(key => [key, String(values.get(key) || '').trim()]));
    if (!body.name || !body.email || !body.message) { setState({ error: 'Please enter your name, email and message.' }); return; }
    pending.current = true; setState({ pending: true });
    try {
      await requestApi('/send-email', { method: 'POST', body });
      form.reset(); setState({ success: true });
    } catch { setState({ error: 'Your message could not be sent. Please try again or email me directly below.' }); }
    finally { pending.current = false; }
  };
  return <form className="contact-form" onSubmit={submit} aria-label="Send Minh a message" aria-busy={state.pending === true}>
    <div className="contact-form-heading"><span className="eyebrow">A CONVERSATION STARTS HERE</span><h3>Send me a note<span>.</span></h3><p>Tell me what you have in mind.</p></div>
    <fieldset disabled={state.pending}><div className="contact-form-grid">
      <label className="utility-field">Your name<input name="name" autoComplete="name" required maxLength={100} placeholder="How should I call you?" /></label>
      <label className="utility-field">Your email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
    </div><label className="utility-field">Phone <span className="optional-label">Optional</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="If you prefer a call" /></label>
    <label className="utility-field">Your message<textarea name="message" required maxLength={5000} placeholder="A project, an opportunity, or just a hello…" /></label>
    <button className="button-primary auth-submit" type="submit">{state.pending ? 'Sending your note…' : 'Send message'}<span aria-hidden="true">↗</span></button></fieldset>
    {state.error && <div className="auth-message auth-message--error" role="alert"><p>{state.error}</p></div>}
    {state.success && <div className="auth-message" role="status"><p>Thank you. Your message has been sent — I’ll get back to you by email.</p></div>}
    <p className="contact-direct">Prefer your email app? <a href={`mailto:${profile.email}`}>Email me directly ↗</a></p>
  </form>;
}

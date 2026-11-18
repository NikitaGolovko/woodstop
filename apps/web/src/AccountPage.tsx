import { useEffect, useState, type FormEvent } from 'react';
import { account, api, type AccountState } from './member-api';

export function AccountPage() {
  const [state, setState] = useState<AccountState | null>(null);
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [notice, setNotice] = useState('');
  const load = async () => { const next = await account(); setState(next); setDisplayName(next.member?.displayName ?? ''); };
  useEffect(() => { load().catch(error => setError(error.message)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/account/${register ? 'register' : 'login'}`, { email: form.get('email'), password: form.get('password'), displayName: form.get('displayName') });
      await load();
      if (register) setNotice('Account created. Check your email to verify it before submitting.');
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  const member = state?.member;
  return <section className="contribution-page"><h1>{member ? 'Your account' : 'Sign in'}</h1>
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!state ? error ? <p><a href="/drafts">Your drafts</a> are still saved on this device.</p> : <p role="status">Loading account…</p> : member ? <>
      <p>{member.email}</p>
      <form className="contribution-form" onSubmit={async event => {
        event.preventDefault(); setBusy(true); setError('');
        try { await api('/api/account/profile', { displayName }); await load(); } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
      }}><label>Display name<input required maxLength={60} value={displayName} onChange={event => setDisplayName(event.target.value)} /></label>
        <p className="muted">Nicknames are welcome. Your email stays private.</p><button className="secondary" disabled={busy}>Save display name</button></form>
      {!member.emailConfirmed && <div className="guidance"><p>Verify your email before submitting a listing.</p>{member.developmentVerification && <button className="secondary" disabled={busy} onClick={async () => {
        setBusy(true); setError(''); try { await api('/api/account/development-verify', {}); await load(); } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
      }}>Verify development account</button>}</div>}
      <nav className="account-links"><a href="/drafts">My drafts</a><a href="/submissions">My submissions</a>{member.isAdmin && <a href="/review">Review queue</a>}</nav>
      <button className="secondary" disabled={busy} onClick={async () => { setBusy(true); try { await api('/api/account/logout', {}); await load(); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}>Sign out</button>
    </> : <>
      <p>Sign in to send a listing for review. Drafts stay saved while you do.</p>
      {new URLSearchParams(location.search).has('error') && <p className="form-error" role="alert">Google sign-in could not complete. If you already have a password account with that email, sign in with your password.</p>}
      {state.googleEnabled && <a className="secondary" href="/api/account/google">Continue with Google</a>}
      {!state.googleEnabled && !state.emailRegistrationEnabled && <p>Sign-in is being set up. You can keep saving drafts on this device.</p>}
      {state.emailRegistrationEnabled && <form className="contribution-form" onSubmit={submit}><fieldset disabled={busy}>
        {register && <label>Display name<input name="displayName" required maxLength={60} autoComplete="nickname" /></label>}
        <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required minLength={register ? 10 : undefined} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} /></label>
        {register && <p className="muted">Use at least 10 characters. A long, unique passphrase works well.</p>}
        <button className="button">{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
      </fieldset></form>}
      {state.emailRegistrationEnabled && <button className="text-button" onClick={() => { setRegister(value => !value); setError(''); }}>{register ? 'Already have an account? Sign in' : 'Create an account'}</button>}
    </>}
  </section>;
}

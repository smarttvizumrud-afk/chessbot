import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
import { enableDemoMode } from '../lib/demoStorage';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const action = mode === 'signup'
      ? supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : supabase.auth.signInWithPassword({ email, password });
    const { error } = await action;
    setBusy(false);
    setMessage(error ? error.message : mode === 'signup' ? 'Check your email to confirm the account.' : '');
  }

  return (
    <section className="auth-card">
      <h1>AI Chess Coach</h1>
      <p>Sign in to save imported games, Stockfish analysis, and your personal training plan.</p>
      <form onSubmit={handleSubmit} className="coach-form">
        <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <button type="submit" disabled={busy}>{busy ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      </form>
      {message && <p className="message">{message}</p>}
      <button className="ghost" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'Create account' : 'I already have an account'}
      </button>
      <button className="ghost" onClick={enableDemoMode}>
        Continue in demo mode
      </button>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

interface TestOrder {
  id: string;
  file_name: string;
  file_mime_type: string;
  file_size_bytes: number;
  page_count: number;
  options: Record<string, unknown>;
  amount_paise: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface TestPreview {
  orderId: string;
  fileName: string;
  mimeType: string;
  objectUrl: string;
}

export default function TestWorkstation() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<TestOrder[]>([]);
  const [preview, setPreview] = useState<TestPreview | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const isLoadingQueue = useRef(false);

  const refreshQueue = useCallback(async () => {
    if (!accessToken || isLoadingQueue.current) return;
    isLoadingQueue.current = true;
    setIsRefreshing(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{
        orders: TestOrder[];
        test_mode: boolean;
        printing_enabled: boolean;
      }>('test-workstation-orders');
      if (invokeError) throw invokeError;
      if (!data || data.test_mode !== true || data.printing_enabled !== false || !Array.isArray(data.orders)) {
        throw new Error('The test workstation returned an invalid queue response.');
      }
      setOrders(data.orders);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      isLoadingQueue.current = false;
      setIsRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setAccessToken(data.session?.access_token ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAccessToken(session?.access_token ?? null);
      if (!session) {
        setOrders([]);
        setPreview(null);
      }
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    void refreshQueue();
    const timer = window.setInterval(() => void refreshQueue(), 5000);
    return () => window.clearInterval(timer);
  }, [accessToken, refreshQueue]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.objectUrl);
    };
  }, [preview]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setIsSigningIn(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      setPassword('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  };

  const openDocument = async (order: TestOrder) => {
    if (!accessToken) return;
    setError('');
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/test-workstation-document?order_id=${encodeURIComponent(order.id)}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { detail?: unknown } | null;
        throw new Error(typeof body?.detail === 'string' ? body.detail : `Document preview failed (${response.status}).`);
      }
      const mimeType = response.headers.get('Content-Type')?.split(';')[0].trim();
      if (!mimeType || !['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType)) {
        throw new Error('The test workstation received an unsupported document type.');
      }
      const blob = await response.blob();
      if (blob.size < 1 || blob.size > 2_621_440) {
        throw new Error('The test document is outside the permitted size limit.');
      }
      setPreview({
        orderId: order.id,
        fileName: order.file_name,
        mimeType,
        objectUrl: URL.createObjectURL(blob),
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <main style={{ minHeight: '100vh', padding: 24, background: '#f1f5f9', color: '#0f172a', fontFamily: 'Segoe UI, sans-serif' }}>
      <header style={{ maxWidth: 1000, margin: '0 auto 24px', padding: 20, borderRadius: 12, background: '#7c2d12', color: '#fff' }}>
        <strong style={{ display: 'block', fontSize: 20 }}>TEST MODE — PRINTING DISABLED</strong>
        <span>Isolated Razorpay Test Mode orders · No production queue · No printer access</span>
      </header>

      {error && <p role="alert" style={{ maxWidth: 1000, margin: '0 auto 16px', color: '#b91c1c' }}>{error}</p>}

      {!accessToken ? (
        <form onSubmit={signIn} style={{ maxWidth: 440, margin: '40px auto', padding: 24, borderRadius: 12, background: '#fff', display: 'grid', gap: 14 }}>
          <h1 style={{ margin: 0 }}>Test workstation sign-in</h1>
          <label>
            Email
            <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} style={{ display: 'block', width: '100%', padding: 10, marginTop: 6 }} />
          </label>
          <label>
            Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ display: 'block', width: '100%', padding: 10, marginTop: 6 }} />
          </label>
          <button type="submit" disabled={isSigningIn} style={{ padding: 12 }}>
            {isSigningIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: 24, borderRadius: 12, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h1 style={{ margin: 0 }}>Verified test payment queue</h1>
              <p style={{ margin: '6px 0 0', color: '#475569' }}>Only paid orders for your assigned test shop are shown.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => void refreshQueue()} disabled={isRefreshing}>
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <button type="button" onClick={() => void signOut()}>Sign out</button>
            </div>
          </div>

          {orders.length === 0 ? (
            <p>No verified test payments yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {orders.map((order) => (
                <li key={order.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14 }}>
                  <div>
                    <strong>{order.file_name}</strong>
                    <div style={{ color: '#475569', fontSize: 14 }}>
                      {order.page_count} pages · {(order.amount_paise / 100).toFixed(2)} {order.currency} · {order.paid_at ? new Date(order.paid_at).toLocaleString() : 'Paid'}
                    </div>
                    <code>{order.id}</code>
                  </div>
                  <button type="button" onClick={() => void openDocument(order)}>Preview privately</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {preview && (
        <div role="dialog" aria-modal="true" aria-label="Private test document preview" style={{ position: 'fixed', inset: 0, zIndex: 10, background: 'rgba(15, 23, 42, .88)', padding: 20, display: 'grid', gridTemplateRows: 'auto 1fr', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
            <strong>{preview.fileName} · TEST MODE · PRINTING DISABLED</strong>
            <button type="button" onClick={() => setPreview(null)}>Close preview</button>
          </div>
          {preview.mimeType === 'application/pdf'
            ? <iframe title={`Preview ${preview.fileName}`} src={preview.objectUrl} style={{ width: '100%', height: '100%', border: 0, background: '#fff' }} />
            : <img alt={preview.fileName} src={preview.objectUrl} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', margin: 'auto', objectFit: 'contain' }} />}
        </div>
      )}
    </main>
  );
}

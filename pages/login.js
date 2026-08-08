import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log('LOGIN SONUCU:', {
        user: data?.user?.email,
        session: !!data?.session,
        error: error?.message,
      });

      if (error) {
        setError(`Giriş başarısız: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data?.session) {
        setError('Giriş yapıldı ancak oturum oluşturulamadı.');
        setLoading(false);
        return;
      }

      // Session gerçekten oluştu mu kontrol et
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        setError(`Oturum kontrolü başarısız: ${sessionError.message}`);
        setLoading(false);
        return;
      }

      if (!sessionData?.session) {
        setError('Oturum bulunamadı. Lütfen tekrar deneyin.');
        setLoading(false);
        return;
      }

      // Başarılı giriş
      window.location.href = '/';

    } catch (err) {
      console.error('LOGIN EXCEPTION:', err);
      setError(`Beklenmeyen hata: ${err.message}`);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          padding: '35px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '42px', marginBottom: '10px' }}>
            🏗️
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '24px',
              color: '#0f172a',
            }}
          >
            Esmahan Yapı
          </h1>

          <p
            style={{
              marginTop: '8px',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            Şantiye Yönetim Portalı
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: 'block',
              marginBottom: '7px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
            }}
          >
            E-posta
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta adresiniz"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '13px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          />

          <label
            style={{
              display: 'block',
              marginBottom: '7px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
            }}
          >
            Şifre
          </label>

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifreniz"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '13px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          />

          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#94a3b8' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}

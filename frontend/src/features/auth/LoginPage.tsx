/**
 * LoginPage
 * Google OAuth UI + Supabase Auth ハイブリッド実装
 *
 * Issue: Google OAuth UI復元
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from './hooks/useAuth';

const LOGIN_FAILED_MESSAGE = 'ログインに失敗しました。時間をおいて再度お試しください。';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      console.error('[LoginPage] No credential received from Google');
      return;
    }

    setErrorMessage(null);
    try {
      await loginWithGoogle(credentialResponse.credential);
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/', { replace: true });
    } catch (error) {
      console.error('[LoginPage] Login failed:', error);
      setErrorMessage(LOGIN_FAILED_MESSAGE);
    }
  };

  const handleGoogleError = () => {
    console.error('[Google OAuth] Popup login failed, showing redirect fallback');
    setShowFallback(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f5f5f5',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: '6px', color: '#333' }}>
          Learnify
        </h1>
        <p
          style={{
            marginBottom: '4px',
            color: '#555',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          AI-Powered Multimodal Learning
        </p>
        <p style={{ marginBottom: '30px', color: '#666', fontWeight: '600' }}>
          AIが作る、あなたの教材
        </p>

        {/* Google 公式 OAuth UI（ポップアップ型） */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

        {errorMessage && (
          <p role="alert" style={{ marginTop: '16px', color: '#b91c1c', fontSize: '13px' }}>
            {errorMessage}
          </p>
        )}

        {/* サードパーティCookieブロック時のフォールバック（リダイレクト型） */}
        {showFallback && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>
              上のボタンで表示されない場合はこちら
            </p>
            <button
              onClick={login}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                background: '#4285f4',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Googleアカウントでログイン
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

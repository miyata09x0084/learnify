/**
 * DashboardHeader - 公開トップのヘッダー
 * ログイン状態に応じて「ログイン」または「ユーザー名 + ログアウト」を表示する
 * 認証状態の読み込み中は右側を空にしてチラつきを防ぐ
 */

import { useNavigate } from 'react-router-dom';
import type { UserInfo } from '@/types';

interface DashboardHeaderProps {
  user: UserInfo | null;
  loading: boolean;
  onLogout: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  logo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: '-0.5px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minHeight: '36px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '2px solid #e5e7eb',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  button: {
    padding: '8px 16px',
    fontSize: '13px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

export default function DashboardHeader({ user, loading, onLogout }: DashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <div style={styles.header}>
      <h1 style={styles.logo}>Learnify</h1>

      <div style={styles.userSection}>
        {!loading && user && (
          <>
            <img src={user.picture} alt={user.name} style={styles.avatar} />
            <div style={styles.userName}>{user.name}</div>
            <button onClick={onLogout} style={styles.button}>
              ログアウト
            </button>
          </>
        )}
        {!loading && !user && (
          <button onClick={() => navigate('/login')} style={styles.button}>
            ログイン
          </button>
        )}
      </div>
    </div>
  );
}

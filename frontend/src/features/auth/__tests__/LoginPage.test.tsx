/**
 * LoginPage のテスト
 * ログイン失敗時にユーザーへ文言を表示すること
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import * as useAuthModule from '../hooks/useAuth';

vi.mock('../hooks/useAuth');

// GoogleLogin を「押すと onSuccess を呼ぶボタン」に置き換える
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: { onSuccess: (r: { credential: string }) => void }) => (
    <button onClick={() => onSuccess({ credential: 'dummy-credential' })}>
      Google
    </button>
  ),
}));

const mockAuth = (loginWithGoogle: () => Promise<void>) => {
  vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
    isAuthenticated: false,
    user: null,
    loading: false,
    login: vi.fn(),
    loginWithGoogle,
    logout: vi.fn(),
  });
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ログイン失敗時にエラー文言を表示する', async () => {
    mockAuth(vi.fn().mockRejectedValue(new Error('network')));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Google'));

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent('ログインに失敗しました。時間をおいて再度お試しください。');
  });

  it('失敗前はエラー文言を表示しない', () => {
    mockAuth(vi.fn().mockResolvedValue(undefined));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.queryByRole('alert')).toBeNull();
  });
});

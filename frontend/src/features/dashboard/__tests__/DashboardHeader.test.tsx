/**
 * DashboardHeader のテスト
 * ログイン状態に応じてヘッダー右側の表示を切り替える
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';

const user = { name: 'Taro', email: 'taro@example.com', picture: 'https://example.com/p.png' };

const renderHeader = (props: React.ComponentProps<typeof DashboardHeader>) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<DashboardHeader {...props} />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('DashboardHeader', () => {
  it('未ログイン時はログインボタンを表示し、押すと /login へ遷移する', () => {
    renderHeader({ user: null, loading: false, onLogout: vi.fn() });

    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('ログイン中はユーザー名とログアウトボタンを表示する', () => {
    const onLogout = vi.fn();
    renderHeader({ user, loading: false, onLogout });

    expect(screen.getByText('Taro')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('認証状態の読み込み中はどちらのボタンも表示しない', () => {
    renderHeader({ user: null, loading: true, onLogout: vi.fn() });

    expect(screen.queryByRole('button')).toBeNull();
  });
});

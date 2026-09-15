/**
 * SlideDetailPage のテスト
 * 認証状態の解決を待ってから取得し、匿名で非公開スライドを開いたらログインへ誘導する
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';
import SlideDetailPage from '../SlideDetailPage';
import * as api from '../api/get-slide-detail';
import * as useAuthModule from '../../auth/hooks/useAuth';

vi.mock('../api/get-slide-detail');
vi.mock('../../auth/hooks/useAuth');

const authState = (user: { name: string; email: string; picture: string } | null, loading: boolean) => {
  vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
    isAuthenticated: !!user,
    user,
    loading,
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  });
};

const detailState = (state: { data?: unknown; isLoading: boolean; error: unknown }) =>
  vi.spyOn(api, 'useSlideDetail').mockReturnValue(state as unknown as ReturnType<typeof api.useSlideDetail>);

const axios401 = () =>
  new AxiosError('Unauthorized', '401', undefined, undefined, {
    status: 401,
    statusText: 'Unauthorized',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/slides/slide-1']}>
      <Routes>
        <Route path="/slides/:slideId" element={<SlideDetailPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('SlideDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証状態の読み込み中は取得を開始しない', () => {
    authState(null, true);
    const spy = detailState({ isLoading: true, error: null });

    renderPage();

    expect(spy).toHaveBeenCalledWith('slide-1', { enabled: false });
  });

  it('匿名で非公開スライドを開いて401なら /login へ遷移する', () => {
    authState(null, false);
    detailState({ isLoading: false, error: axios401() });

    renderPage();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('ログイン済みで401ならログインへは飛ばさずエラー表示する', () => {
    authState({ name: 'Taro', email: 't@example.com', picture: '' }, false);
    detailState({ isLoading: false, error: axios401() });

    renderPage();

    expect(screen.queryByText('Login Page')).toBeNull();
    expect(screen.getByText('Error loading slide')).toBeInTheDocument();
  });
});

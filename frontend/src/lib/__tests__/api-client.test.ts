/**
 * api-client のテスト
 * 401 時のログイン画面リダイレクトは「トークンを送ったのに拒否された」場合に限る
 * （公開ページでセッション復元前に飛んだ匿名リクエストの 401 で追い出さないため）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-session', () => ({
  getCachedAccessToken: vi.fn(() => null),
}));
vi.mock('@/config/env', () => ({
  env: { API_URL: 'http://localhost:8001/api' },
}));

import { api } from '../api-client';

// axios が保持する response インターセプタの reject ハンドラを取り出す
const getRejectedHandler = () => {
  const handlers = (api.interceptors.response as unknown as {
    handlers: Array<{ rejected: (error: unknown) => Promise<never> }>;
  }).handlers;
  return handlers[0].rejected;
};

const make401 = (authorization?: string) => ({
  response: { status: 401, data: {} },
  config: { url: '/slides/x/markdown', headers: authorization ? { Authorization: authorization } : {} },
  message: 'Request failed with status code 401',
});

describe('api-client 401 handling', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(window, 'location', {
      value: { href: '/slides/x' },
      writable: true,
      configurable: true,
    });
  });

  it('Authorization 付きリクエストが 401 なら /login へ遷移する', async () => {
    await expect(getRejectedHandler()(make401('Bearer expired'))).rejects.toBeDefined();

    expect(window.location.href).toBe('/login');
  });

  it('Authorization 無しリクエストの 401 では遷移しない', async () => {
    await expect(getRejectedHandler()(make401())).rejects.toBeDefined();

    expect(window.location.href).toBe('/slides/x');
  });
});

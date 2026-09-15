/**
 * Router Configuration
 * Defines all application routes using React Router v7
 *
 * 認証:
 * - `/`（公開トップ）と `/slides/:slideId`（サンプル動画は匿名閲覧可）はログイン不要
 * - `/generate` のみ ProtectedLayout（AuthGuard）配下
 *
 * コード分割戦略:
 * - ダッシュボード（/）: 静的import（初期表示に必須）
 * - ログイン・生成・スライド詳細: lazy import（別チャンクに分割）
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { queryClient } from '@/lib/react-query';
import { ProtectedLayout } from './routes/app/root';
import { DashboardRoute } from './routes';

// Loaderファクトリー関数をimport
import { createDashboardLoader } from '@/features/dashboard/loaders/dashboardLoader';
import { createSlideDetailLoader } from '@/features/slide/loaders/slideDetailLoader';

export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => {
      const { LoginRoute } = await import('./routes/login');
      return { Component: LoginRoute };
    },
  },
  {
    path: '/',
    element: <DashboardRoute />,
    loader: createDashboardLoader(queryClient),
  },
  {
    path: '/slides/:slideId',
    lazy: async () => {
      const { SlidesRoute } = await import('./routes/app/slides');
      return { Component: SlidesRoute };
    },
    loader: createSlideDetailLoader(queryClient),
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: '/generate/:threadId?',
        lazy: async () => {
          const { GenerateRoute } = await import('./routes/app/generate');
          return { Component: GenerateRoute };
        },
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

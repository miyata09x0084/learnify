/**
 * slideDetailLoader - React Router Loader with React Query prefetch
 * ページ遷移前にスライド詳細をReact Queryキャッシュにプリフェッチ
 */

import type { LoaderFunctionArgs } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { getSlideDetail } from '../api/get-slide-detail';
import { getCachedAccessToken } from '@/lib/auth-session';

export const createSlideDetailLoader = (queryClient: QueryClient) => {
  return async ({ params }: LoaderFunctionArgs) => {
    const { slideId } = params;

    if (!slideId) {
      throw new Error('Slide ID is required');
    }

    // セッション復元前（トークン未取得）はプリフェッチしない。
    // ここで匿名リクエストを飛ばすと、ログイン済みユーザーの自分のスライドが
    // 一時的に401になる。取得は SlideDetailPage 側の useQuery が認証解決後に行う
    if (!getCachedAccessToken()) return null;

    // React Queryキャッシュにプリフェッチ
    // prefetchQueryはエラーを無視するため、try-catchは不要
    await queryClient.prefetchQuery({
      queryKey: ['slide', slideId],
      queryFn: () => getSlideDetail(slideId),
    });

    return null;
  };
};

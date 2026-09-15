/**
 * SlideContentViewer のテスト
 * フィードバック用ハンドラが渡されない（未ログイン）ときは評価UIを出さない
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlideContentViewer } from '../components/SlideContentViewer';
import * as api from '../api/get-slide-detail';

vi.mock('../api/get-slide-detail');

const slide = {
  id: 'slide-1',
  title: 'Test',
  markdown: '# md',
  created_at: '2026-09-15T00:00:00Z',
  pdf_url: null,
  video_url: 'https://example.com/v.mp4',
};

const mockDetail = () => {
  vi.spyOn(api, 'useSlideDetail').mockReturnValue({
    data: slide,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof api.useSlideDetail>);
};

describe('SlideContentViewer', () => {
  it('フィードバックハンドラがあれば評価UIを表示する', () => {
    mockDetail();
    render(
      <SlideContentViewer
        slideId="slide-1"
        onQuickFeedback={vi.fn()}
        onOpenFeedbackModal={vi.fn()}
      />
    );

    expect(screen.getByText('この動画はいかがでしたか？')).toBeInTheDocument();
  });

  it('フィードバックハンドラが無ければ評価UIを表示しない', () => {
    mockDetail();
    render(<SlideContentViewer slideId="slide-1" />);

    expect(screen.queryByText('この動画はいかがでしたか？')).toBeNull();
  });
});

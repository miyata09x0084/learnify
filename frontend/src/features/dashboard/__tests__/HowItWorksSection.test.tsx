/**
 * HowItWorksSection のテスト
 * 生成一時停止中に「どう作るか」をテキストで伝えるセクション
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HowItWorksSection from '../components/HowItWorksSection';
import { HOW_IT_WORKS_STEPS } from '../components/howItWorksSteps';

describe('HowItWorksSection', () => {
  it('5つのステップを順番付きで表示する', () => {
    render(<HowItWorksSection />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent('PDFを読む');
    expect(items[4]).toHaveTextContent('動画に書き出す');
  });

  it('ステップ文言に絵文字を含まない', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    HOW_IT_WORKS_STEPS.forEach((step) => {
      expect(step.title).not.toMatch(emoji);
      expect(step.description).not.toMatch(emoji);
    });
  });
});

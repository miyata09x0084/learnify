/**
 * getCreateCardProps のテスト
 * 生成フラグに応じて「新規作成」カードの表示内容を決める
 */

import { describe, it, expect } from 'vitest';
import { getCreateCardProps } from '../components/createCardProps';

describe('getCreateCardProps', () => {
  it('生成が有効なら「新規作成」でクリック可能', () => {
    const props = getCreateCardProps(true);

    expect(props.title).toBe('新規作成');
    expect(props.clickable).toBe(true);
  });

  it('生成が一時停止中なら「一時停止」でクリック不可、絵文字なし', () => {
    const props = getCreateCardProps(false);

    expect(props.title).toBe('一時停止');
    expect(props.subtitle).toBe('動画生成は一時停止しています。サンプル動画をご覧ください。');
    expect(props.clickable).toBe(false);
    expect(props.icon).toBeUndefined();
  });
});

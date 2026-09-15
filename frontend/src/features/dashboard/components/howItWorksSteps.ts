/**
 * 「仕組み」セクションのステップ定義
 * 画像アセットは持たない（コンセプト転換時に文言差し替えだけで済ませるため）
 */

export interface HowItWorksStep {
  title: string;
  description: string;
}

export const HOW_IT_WORKS_STEPS: readonly HowItWorksStep[] = [
  { title: 'PDFを読む', description: 'アップロードされた資料からテキストを抽出します。' },
  { title: '要点を抽出', description: 'AIが内容を要約し、学習に必要な要点を5つに絞ります。' },
  { title: 'スライドを構成', description: '要点をもとに、1枚1メッセージのスライドを組み立てます。' },
  { title: 'ナレーションを合成', description: 'スライドごとに解説の音声を生成します。' },
  { title: '動画に書き出す', description: 'スライドと音声を合成し、そのまま視聴できる動画にします。' },
];

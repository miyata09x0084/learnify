/**
 * 「新規作成」カードの表示内容
 * 生成一時停止中（VITE_GENERATION_ENABLED=false）は「一時停止」表示に切り替える
 * 用語は CONTEXT.md に従う（「一時停止」「サンプル動画」）
 */

export interface CreateCardProps {
  icon?: string;
  title: string;
  subtitle: string;
  clickable: boolean;
}

export function getCreateCardProps(generationEnabled: boolean): CreateCardProps {
  if (generationEnabled) {
    return {
      icon: '📄',
      title: '新規作成',
      subtitle: 'PDFから動画を生成',
      clickable: true,
    };
  }
  return {
    title: '一時停止',
    subtitle: '動画生成は一時停止しています。サンプル動画をご覧ください。',
    clickable: false,
  };
}

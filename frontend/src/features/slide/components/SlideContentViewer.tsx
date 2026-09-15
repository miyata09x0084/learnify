/**
 * SlideContentViewer - 動画再生専用コンポーネント
 * SlideDetailPageの左ペインで使用（2ペインレイアウト用）
 */

import { useSlideDetail } from '../api/get-slide-detail';
import { InlineFeedback } from './InlineFeedback';

interface SlideContentViewerProps {
  slideId: string;
  /** 未指定（未ログイン）のときは評価UIを表示しない */
  onQuickFeedback?: (rating: number) => Promise<void>;
  onOpenFeedbackModal?: () => void;
}

export function SlideContentViewer({ slideId, onQuickFeedback, onOpenFeedbackModal }: SlideContentViewerProps) {
  // React Queryフックで動画詳細を取得
  const { data: slide, isLoading: loading, error } = useSlideDetail(slideId);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>エラー</h2>
          <p style={styles.errorText}>{error.message || '動画の読み込みに失敗しました'}</p>
        </div>
      </div>
    );
  }

  if (!slide) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* 動画プレイヤー */}
      {slide.video_url ? (
        <div style={styles.videoSection}>
          <div style={styles.videoContainer}>
            <video
              src={slide.video_url}
              controls
              autoPlay={false}
              style={styles.videoPlayer}
              preload="metadata"
            >
              お使いのブラウザは動画タグをサポートしていません。
              <a href={slide.video_url} download>動画をダウンロード</a>
            </video>
          </div>

          {/* ダウンロードボタン */}
          <div style={styles.downloadSection}>
            <a
              href={slide.video_url}
              download
              style={styles.downloadButton}
            >
              🎬 動画をダウンロード
            </a>
          </div>

          {/* インラインフィードバック（ログイン中のみ。送信APIが認証必須のため） */}
          {onQuickFeedback && onOpenFeedbackModal && (
            <InlineFeedback
              slideId={slideId}
              onQuickFeedback={onQuickFeedback}
              onOpenDetail={onOpenFeedbackModal}
            />
          )}
        </div>
      ) : (
        /* 動画が存在しない場合のメッセージ */
        <div style={styles.noVideoMessage}>
          <div style={styles.noVideoIcon}>🎬</div>
          <h3 style={styles.noVideoTitle}>動画を生成中...</h3>
          <p style={styles.noVideoText}>
            動画はまだ生成されていません。<br />
            しばらくお待ちください。
          </p>
        </div>
      )}

      {/* フッター */}
      <div style={styles.footer}>
        <span style={styles.timestamp}>
          作成日時: {new Date(slide.created_at).toLocaleString('ja-JP')}
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
  },
  loadingText: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#999',
  },
  errorCard: {
    padding: '40px',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#dc3545',
    marginBottom: '16px',
  },
  errorText: {
    color: '#999',
  },
  videoSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '24px',
  },
  videoContainer: {
    width: '100%',
    maxWidth: '100%',
    background: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  videoPlayer: {
    width: '100%',
    display: 'block',
    maxHeight: '70vh',
  },
  downloadSection: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
  },
  downloadButton: {
    padding: '12px 24px',
    fontSize: '15px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
  },
  noVideoMessage: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
  },
  noVideoIcon: {
    fontSize: '64px',
    marginBottom: '24px',
    opacity: 0.5,
  },
  noVideoTitle: {
    fontSize: '24px',
    color: '#fff',
    marginBottom: '12px',
    fontWeight: '600',
  },
  noVideoText: {
    fontSize: '16px',
    color: '#999',
    lineHeight: 1.6,
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #333',
    textAlign: 'center',
  },
  timestamp: {
    fontSize: '13px',
    color: '#666',
  },
};

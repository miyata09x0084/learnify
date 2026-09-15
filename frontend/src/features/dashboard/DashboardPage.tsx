/**
 * DashboardPage - 公開トップ兼ダッシュボード
 * ログイン不要でサンプル動画と仕組みを閲覧でき、ログイン中は「あなたの動画」が追加表示される
 * 全ての要素を同じサイズのカードとして表示
 * React Query使用でデータ取得
 * React.memo + useCallback で再レンダリング最適化
 */

import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuth } from "../auth";
import { useReactAgent } from "../generation";
import { useSlides } from "./api/get-slides";
import { useSamples } from "./api/get-samples";
import { uploadPdf } from "./api/upload-pdf";
import UnifiedCard from "./components/UnifiedCard";
import QuickActionMenu from "./components/QuickActionMenu";
import DashboardHeader from "./components/DashboardHeader";
import HowItWorksSection from "./components/HowItWorksSection";
import { getCreateCardProps } from "./components/createCardProps";
import { env } from "@/config/env";

const createCard = getCreateCardProps(env.GENERATION_ENABLED);

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gridAutoRows: "minmax(200px, auto)",
    gap: "20px",
    padding: "32px",
    maxWidth: "1440px",
    margin: "0 auto",
  },
  gridContainerNoTopPadding: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gridAutoRows: "minmax(200px, auto)",
    gap: "20px",
    padding: "0 32px 32px 32px",
    maxWidth: "1440px",
    margin: "0 auto",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "60px 20px",
    color: "#9ca3af",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: "8px",
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#9ca3af",
  },
  sectionTitleContainer: {
    maxWidth: "1440px",
    margin: "0 auto",
    padding: "8px 32px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#374151",
    margin: 0,
  },
  heroBanner: {
    gridColumn: "1 / -1",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "16px",
    padding: "32px",
    textAlign: "center",
    color: "white",
    marginBottom: "12px",
  },
  heroBannerIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  heroBannerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    color: "white",
  },
  heroBannerSubtitle: {
    fontSize: "15px",
    fontWeight: "400",
    margin: 0,
    color: "rgba(255, 255, 255, 0.9)",
  },
  skeletonCard: {
    background: "#e5e7eb",
    borderRadius: "12px",
    minHeight: "200px",
    animation: "pulse 1.5s ease-in-out infinite",
  },
};

// レスポンシブ対応のCSS
const responsiveStyles = `
  @media (max-width: 639px) {
    .dashboard-grid {
      grid-template-columns: 1fr !important;
      padding: 20px !important;
      gap: 16px !important;
    }
  }

  @media (min-width: 640px) and (max-width: 1023px) {
    .dashboard-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 18px !important;
    }
  }

  @media (min-width: 1024px) and (max-width: 1279px) {
    .dashboard-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 20px !important;
    }
  }

  @media (min-width: 1280px) {
    .dashboard-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 24px !important;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }
`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: isAuthLoading, logout } = useAuth();
  const { resetChat } = useReactAgent();

  // React Queryでスライド履歴を取得（JWTから自動的にuser_idを取得）
  const { data, isLoading: isSlidesLoading } = useSlides(
    { limit: 20 },
    { enabled: !!user },
  );
  const slides = data?.slides || [];

  // サンプル動画を取得（ログイン不要）
  const { data: samplesData, isLoading: isSamplesLoading } = useSamples();
  const samples = samplesData?.samples || [];

  const [showAll, setShowAll] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // ログアウト処理（公開トップに留まり、ヘッダーが「ログイン」に切り替わる）
  const handleLogout = () => {
    logout();
  };

  // クイックメニューを開く（未ログインならログインへ誘導）
  const handleNewSlide = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowQuickMenu(true);
  }, [user, navigate]);

  // QuickActionMenuからのPDFアップロード選択時
  const handleSelectUpload = () => {
    // 過去の状態をクリア（Issue: 新規作成時にキャッシュが残る問題を修正）
    resetChat();

    // ファイル選択ダイアログを開く
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // ファイルサイズチェック
        if (file.size > 100 * 1024 * 1024) {
          alert("ファイルサイズは100MB以下にしてください");
          return;
        }

        // 楽観的UI更新: 即座にローディング画面へ遷移
        navigate("/generate", {
          state: {
            pdfFile: file, // ファイルオブジェクトを渡す
            autoStart: true,
          },
        });

        // バックグラウンドでアップロード処理（非同期）
        // エラー時のみユーザーに通知
        try {
          await uploadPdf({ file });
          // アップロード成功（プログレス画面で状態更新される）
        } catch (err) {
          console.error("❌ アップロードエラー:", err);
          // エラー時はダッシュボードに戻る
          alert("アップロードに失敗しました");
          navigate("/", { replace: true });
        }
      }
    };
    input.click();
  };

  // スライドクリック
  const handleSlideClick = useCallback(
    (slideId: string) => {
      navigate(`/slides/${slideId}`);
    },
    [navigate],
  );

  // もっと読み込むクリック
  const handleShowAll = useCallback(() => {
    setShowAll(true);
  }, []);

  // 表示するスライド数
  const displayedSlides = showAll ? slides : slides.slice(0, 5);
  const remainingCount = slides.length - displayedSlides.length;

  return (
    <div style={styles.container}>
      <DashboardHeader
        user={user}
        loading={isAuthLoading}
        onLogout={handleLogout}
      />

      {/* サンプルセクション（ローディング中はスケルトン表示） */}
      {isSamplesLoading && (
        <div className="dashboard-grid" style={styles.gridContainer}>
          <div
            style={{
              ...styles.heroBanner,
              opacity: 0.5,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      )}
      {!isSamplesLoading && samples.length > 0 && (
        <div className="dashboard-grid" style={styles.gridContainer}>
          <div style={styles.heroBanner}>
            <div style={styles.heroBannerIcon}>🎬</div>
            <h2 style={styles.heroBannerTitle}>サンプル動画で機能を体験</h2>
            <p style={styles.heroBannerSubtitle}>
              まずはサンプルで、AIが生成する動画の品質を確認してみましょう
            </p>
          </div>

          {/* サンプル動画カード */}
          {samples.map((sample) => (
            <UnifiedCard
              key={sample.id}
              icon="🎬"
              title={sample.title}
              onClickWithArg={handleSlideClick}
              clickArg={sample.id}
              variant="sample"
              className="card-sample"
            />
          ))}
        </div>
      )}

      {/* 新規作成（一時停止中は「一時停止」を表示し、クリック不可） */}
      <div className="dashboard-grid" style={styles.gridContainerNoTopPadding}>
        <UnifiedCard
          icon={createCard.icon}
          title={createCard.title}
          subtitle={createCard.subtitle}
          onClick={createCard.clickable ? handleNewSlide : undefined}
          variant="primary"
          className="card-default"
        />
      </div>

      {/* 仕組み（ログイン不要） */}
      <HowItWorksSection />

      {/* あなたの動画（ログイン中のみ） */}
      {user && (
        <>
          <div style={styles.sectionTitleContainer}>
            <h2 style={styles.sectionTitle}>📂 あなたの動画</h2>
          </div>

          <div
            className="dashboard-grid"
            style={styles.gridContainerNoTopPadding}
          >
            {/* ローディング中はスケルトンカード表示 */}
            {isSlidesLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={styles.skeletonCard} />
                ))}
              </>
            ) : displayedSlides.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🎬</div>
                <div style={styles.emptyText}>まだ動画がありません</div>
                <div style={styles.emptySubtext}>
                  新規作成から動画を作成してみましょう
                </div>
              </div>
            ) : (
              <>
                {displayedSlides.map((slide) => {
                  // 日付フォーマットをメモ化するためにコンポーネント外で計算
                  const formattedDate = new Date(
                    slide.created_at,
                  ).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <UnifiedCard
                      key={slide.id}
                      icon="🎬"
                      title={slide.title}
                      subtitle={formattedDate}
                      onClickWithArg={handleSlideClick}
                      clickArg={slide.id}
                      variant="history"
                      className="card-default"
                    />
                  );
                })}

                {/* もっと読み込むカード */}
                {remainingCount > 0 && !showAll && (
                  <UnifiedCard
                    icon="⬇️"
                    title="もっと読み込む"
                    subtitle={`残り${remainingCount}件`}
                    onClick={handleShowAll}
                    variant="more"
                    className="card-default"
                  />
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* クイックアクションメニュー */}
      {showQuickMenu && (
        <QuickActionMenu
          onClose={() => setShowQuickMenu(false)}
          onSelectUpload={handleSelectUpload}
        />
      )}

      <style>{responsiveStyles}</style>
    </div>
  );
}

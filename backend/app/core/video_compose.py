"""動画レンダリング共通処理。

動画生成は3経路に重複していた（技術的負債）:
  - routers/render.py: _render_video_blocking（同期）
  - routers/render.py: _run_video_job_local（ローカルJob）
  - jobs/video_render_job.py: main（Cloud Run Job）

本モジュールは、3経路で verbatim 重複していた純粋ロジックを集約する。
MoviePy 合成本体（compose_video）は ffmpeg/moviepy 依存で重いため、別段階で抽出予定。

NOTE: moviepy など重い依存は module トップで import しない（import 副作用ゼロを維持）。
"""

import re
from pathlib import Path
from typing import List, Tuple

import requests


def slugify_title(title: str) -> str:
    """タイトルを動画ファイル名用の英語スラッグへ変換する。

    render.py の _slugify_en と video_render_job.py の slugify が完全一致だったため統合。
    （core/utils._slugify_en は別実装・別用途なので統合対象外）
    """
    slug = (title or "").lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug or "ai-slide"


def align_audio_and_images(
    png_files: List[Path],
    audio_files: List[str],
) -> Tuple[List[Path], List[str]]:
    """PNG と音声の数を揃える（少ない方に合わせて切り詰める）。

    3経路で完全一致していた数合わせロジックを集約。戻り値: (png_files, audio_files)。
    """
    if len(png_files) != len(audio_files):
        n = min(len(png_files), len(audio_files))
        png_files = png_files[:n]
        audio_files = audio_files[:n]
    return png_files, audio_files


def download_audio_file(url: str, dest_path: Path, timeout: int = 120) -> bool:
    """URL から音声ファイルをダウンロードして dest_path に保存する。

    成功: True / 失敗: False。
    render.py(timeout=60) と video_render_job.py(timeout=120) で重複していたものを統合。
    タイムアウトは生成系の大きめファイルに合わせ 120 秒を既定とする。
    """
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        dest_path.write_bytes(response.content)
        return True
    except Exception as e:
        print(f"[video_compose] Failed to download audio: {e}")
        return False

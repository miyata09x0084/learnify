"""core/video_compose.py の純粋ヘルパーの単体テスト。

動画レンダリング3経路から抽出した共通ロジックを固定する。
（LLM/moviepy 非依存。ネットワークは mock で遮断）
"""
from pathlib import Path
from unittest.mock import MagicMock, patch

from app.core.video_compose import (
    slugify_title,
    align_audio_and_images,
    download_audio_file,
)


# --- slugify_title ---

def test_slugify_title_basic():
    assert slugify_title("Hello World") == "hello-world"


def test_slugify_title_strips_symbols_and_underscores():
    # 既存挙動を固定: 記号(!)とアンダースコア(_)は「削除」される（\s に _ は含まれないため
    # 最初の除去正規表現で消える）。空白のみがハイフンへ変換される。
    assert slugify_title("My_Cool Title!") == "mycool-title"


def test_slugify_title_empty_falls_back():
    assert slugify_title("") == "ai-slide"


def test_slugify_title_non_ascii_falls_back():
    # 英数字以外（日本語等）は除去され、空になればフォールバック
    assert slugify_title("日本語タイトル") == "ai-slide"


# --- align_audio_and_images ---

def test_align_equal_lengths_unchanged():
    png = [Path("a.png"), Path("b.png")]
    audio = ["a.mp3", "b.mp3"]
    assert align_audio_and_images(png, audio) == (png, audio)


def test_align_more_png_truncates_to_audio():
    png = [Path("a.png"), Path("b.png"), Path("c.png")]
    audio = ["a.mp3", "b.mp3"]
    p, a = align_audio_and_images(png, audio)
    assert p == [Path("a.png"), Path("b.png")]
    assert a == ["a.mp3", "b.mp3"]


def test_align_more_audio_truncates_to_png():
    png = [Path("a.png")]
    audio = ["a.mp3", "b.mp3", "c.mp3"]
    p, a = align_audio_and_images(png, audio)
    assert len(p) == 1 and len(a) == 1


# --- download_audio_file ---

def test_download_audio_file_success(tmp_path):
    dest = tmp_path / "out.mp3"
    fake_resp = MagicMock()
    fake_resp.content = b"audio-bytes"
    with patch("app.core.video_compose.requests.get", return_value=fake_resp) as mock_get:
        ok = download_audio_file("http://example/a.mp3", dest, timeout=5)
    assert ok is True
    assert dest.read_bytes() == b"audio-bytes"
    mock_get.assert_called_once_with("http://example/a.mp3", timeout=5)


def test_download_audio_file_failure_returns_false(tmp_path):
    dest = tmp_path / "out.mp3"
    with patch("app.core.video_compose.requests.get", side_effect=Exception("boom")):
        ok = download_audio_file("http://example/a.mp3", dest)
    assert ok is False
    assert not dest.exists()

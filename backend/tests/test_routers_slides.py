"""スライドエンドポイントのテスト

Issue: Supabase Auth統合
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.fixtures.jwt_helper import generate_test_jwt

client = TestClient(app)


def test_list_slides_with_valid_jwt(monkeypatch, mocker):
    """正常なJWTでスライド一覧取得成功"""
    test_jwt = generate_test_jwt(user_id="user-456")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")

    # slides.py内で呼ばれるget_supabase_clientとget_slides_by_userをモック
    mocker.patch(
        "app.routers.slides.get_supabase_client",
        return_value=mocker.MagicMock()
    )
    mocker.patch(
        "app.routers.slides.get_slides_by_user",
        return_value=[{"id": "1", "title": "Test", "user_id": "user-456"}]
    )

    response = client.get(
        "/api/slides",
        headers={"Authorization": f"Bearer {test_jwt}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["slides"]) > 0
    assert data["slides"][0]["user_id"] == "user-456"


def test_list_slides_without_jwt():
    """JWT未提供時に403エラー"""
    response = client.get("/api/slides")
    assert response.status_code == 403


def test_download_slide_user_id_mismatch(monkeypatch, mocker):
    """user_id不一致時に403エラー"""
    test_jwt = generate_test_jwt(user_id="user-789")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")

    # slides.py内で呼ばれるget_supabase_clientをモック
    mocker.patch(
        "app.routers.slides.get_supabase_client",
        return_value=mocker.MagicMock()
    )

    response = client.get(
        "/api/slides/other-user/test.pdf",
        headers={"Authorization": f"Bearer {test_jwt}"}
    )

    assert response.status_code == 403
    assert "他のユーザーのファイルにはアクセスできません" in response.json()["detail"]


# ──────────────────────────────────────────────────────────────
# スライド詳細（サンプル動画は匿名で閲覧可能）
# ──────────────────────────────────────────────────────────────

SAMPLE_USER_ID = "00000000-0000-0000-0000-000000000000"


def _slide_row(user_id: str) -> dict:
    return {
        "id": "slide-1",
        "user_id": user_id,
        "title": "Test",
        "slide_md": "# md",
        "created_at": "2026-09-15T00:00:00Z",
    }


def test_get_sample_markdown_without_jwt(mocker):
    """サンプル動画の詳細はJWT無しでも取得できる"""
    mocker.patch(
        "app.routers.slides.get_slide_by_id",
        return_value=_slide_row(SAMPLE_USER_ID),
    )
    mocker.patch("app.routers.slides.cache.get", return_value=None)

    response = client.get("/api/slides/slide-1/markdown")

    assert response.status_code == 200
    assert response.json()["markdown"] == "# md"


def test_get_private_markdown_without_jwt_returns_401(mocker):
    """他ユーザーのスライドをJWT無しで取得すると401（ログインへ誘導）"""
    mocker.patch(
        "app.routers.slides.get_slide_by_id",
        return_value=_slide_row("user-456"),
    )
    mocker.patch("app.routers.slides.cache.get", return_value=None)

    response = client.get("/api/slides/slide-1/markdown")

    assert response.status_code == 401


def test_get_private_markdown_with_other_user_jwt_returns_403(monkeypatch, mocker):
    """他ユーザーのスライドを別ユーザーのJWTで取得すると403"""
    test_jwt = generate_test_jwt(user_id="user-789")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    mocker.patch(
        "app.routers.slides.get_slide_by_id",
        return_value=_slide_row("user-456"),
    )
    mocker.patch("app.routers.slides.cache.get", return_value=None)

    response = client.get(
        "/api/slides/slide-1/markdown",
        headers={"Authorization": f"Bearer {test_jwt}"},
    )

    assert response.status_code == 403

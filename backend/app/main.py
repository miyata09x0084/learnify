"""
FastAPIメインアプリケーション

PDFアップロード、スライドダウンロード、ヘルスチェック、LangGraphプロキシのAPIを提供
"""

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send

# 設定とルーターのインポート
from app.config import settings
from app.routers import health, uploads, slides, agent, auth, feedback, render
from app.core.supabase import get_supabase_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup: Supabaseクライアントをwarmup ---
    start = time.time()
    client = get_supabase_client()
    if client:
        try:
            client.table("slides").select("id").limit(1).execute()
            elapsed = round((time.time() - start) * 1000)
            print(f"✅ Supabase client warmed up ({elapsed}ms)")
        except Exception as e:
            print(f"⚠️ Supabase warmup query failed: {e}")
    else:
        print("⚠️ Supabase not configured, skipping warmup")
    yield


# FastAPIアプリケーション作成
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    lifespan=lifespan,
)

# レスポンスタイム計測ミドルウェア（Pure ASGI: SSEストリーミングを妨げない）
class TimingMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start = time.perf_counter()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                elapsed_ms = round((time.perf_counter() - start) * 1000)
                headers = list(message.get("headers", []))
                headers.append((b"x-response-time", f"{elapsed_ms}ms".encode()))
                message = {**message, "headers": headers}
                path = scope.get("path", "")
                method = scope.get("method", "")
                if elapsed_ms > 200:
                    print(f"[SLOW] {method} {path} {elapsed_ms}ms")
            await send(message)

        await self.app(scope, receive, send_wrapper)

app.add_middleware(TimingMiddleware)

# CORS設定（フロントエンドからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを登録（/api プレフィックス付き）
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(uploads.router, prefix="/api", tags=["uploads"])
app.include_router(slides.router, prefix="/api", tags=["slides"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(feedback.router, prefix="/api", tags=["feedback"])
app.include_router(render.router, prefix="/api", tags=["render"])


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "Learnify API",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    print(f"🧪 Starting {settings.API_TITLE} on http://{settings.HOST}:{settings.PORT}")
    print(f"📚 API docs available at http://{settings.HOST}:{settings.PORT}/docs")
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)

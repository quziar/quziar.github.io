import asyncio
import time
import subprocess
import os
import redis
import hvac
import requests
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from scripts.redis_session import RedisSessionMiddleware
from database.sync_db_to_github import sync_db_to_github

# 引入路由
from routes import (
    question_router,
    save_users_router,
    admin_router,
    session_router,
    exam_router,
    fonts_router,
)

# 初始化 FastAPI
app = FastAPI(title="題庫系統")

# 加入中介軟體
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.smartlearningzones.com/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RedisSessionMiddleware)

# 設定
REDIS_URL = "rediss://red-cvt7qth5pdvs739hg6o0:iD1SXjcwMKL5xyHgXBVa9FRBIbzFMytH@singapore-keyvalue.render.com:6379"

@app.on_event("startup")
async def startup_event():
    # Redis 初始化
    app.state.redis = redis.StrictRedis.from_url(REDIS_URL)

    # 啟動定期同步任務
    asyncio.create_task(sync_databases_periodically())

@app.get("/", response_class=RedirectResponse)
async def redirect_to_index():
    return RedirectResponse(url="/static/home.html")

# 掛載靜態資料夾
app.mount("/static", StaticFiles(directory="static"), name="static")

# 註冊 API 路由
app.include_router(question_router, prefix="/api/questions", tags=["Questions"])
app.include_router(save_users_router, prefix="/api/save_users", tags=["Save Users"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(session_router, prefix="/api/session", tags=["session"])
app.include_router(exam_router, prefix="/api/exam", tags=["exam"])
app.include_router(fonts_router, prefix="/api/fonts", tags=["fonts"])

@app.get("/test/")
async def test_route():
    return {"message": "測試路由正常工作"}

# 定期同步資料庫的任務
async def sync_databases_periodically():
    while True:
        print("🔄 同步資料庫中...")
        try:
            sync_db_to_github()
        except Exception as e:
            print("❌ 同步腳本失敗：", e)
        await asyncio.sleep(3600)

# 本地測試
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

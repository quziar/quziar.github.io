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
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from scripts.redis_session import RedisSessionMiddleware
from scripts.online_people import router as online_router
from database.sync_db_to_github import sync_db_to_github

# 引入路由
from routes import (
    question_router,
    save_users_router,
    session_router,
    exam_router,
    fonts_router,
    SL_router,
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
REDIS_URL = "redis://red-cvt7qth5pdvs739hg6o0:6379"

@app.on_event("startup")
async def startup_event():
    # Redis 初始化
    app.state.redis = redis.StrictRedis.from_url(REDIS_URL)
    
    # 啟動定期同步任務
    asyncio.create_task(sync_databases_periodically())

@app.get("/", response_class=RedirectResponse)
async def redirect_to_index():
    #return RedirectResponse(url="/static/home.html")
    return FileResponse("static/home.html")

@app.get("/s")
async def student_page():
    return FileResponse("static/styl.html")

@app.get("/s/e")
async def student_page():
    return FileResponse("static/exam.html")

@app.get("/s/p")
async def student_page():
    return FileResponse("static/practice.html")

@app.get("/s/c")
async def student_page():
    return FileResponse("static/profiles.html")

@app.get("/t")
async def teacher_page():
    return FileResponse("static/teacher.html")

@app.get("/t/c")
async def teacher_page():
    return FileResponse("static/tpro.html")

@app.get("/a")
async def admin_dashboard_page():
    return FileResponse("static/admin_dashboard.html")

@app.get("/edit/{question_id}")
async def edit_page(question_id: int):
    return FileResponse("static/edit.html")

@app.get("/t/c/{classroom:path}")
async def class_page(classroom: str):
    return FileResponse("static/classroom.html")

# 掛載靜態資料夾
app.mount("/static", StaticFiles(directory="static"), name="static")

# 註冊 API 路由
app.include_router(question_router, prefix="/api/questions", tags=["Questions"])
app.include_router(save_users_router, prefix="/api/save_users", tags=["Save Users"])
app.include_router(session_router, prefix="/api/session", tags=["session"])
app.include_router(exam_router, prefix="/api/exam", tags=["exam"])
app.include_router(fonts_router, prefix="/api/fonts", tags=["fonts"])
app.include_router(SL_router, prefix="/api/SL", tags=["SL"])
app.include_router(online_router, tags=["Online"])

@app.get("/test/")
async def test_route():
    return {"message": "測試路由正常工作"}

    
# ✅ 掛載圖片目錄
app.mount("/database/pictures", StaticFiles(directory="database/pictures"), name="question_images")

# 定期同步資料庫的任務
async def sync_databases_periodically():
    while True:
        print("🔄 同步資料庫中...")
        try:
            sync_db_to_github()
        except Exception as e:
            print("❌ 同步腳本失敗：", e)
        await asyncio.sleep(3600)

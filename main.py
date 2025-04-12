import asyncio
import time
import subprocess
import os
import redis
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from scripts.redis_session import RedisSessionMiddleware

# 正確引入路由
from routes.questions import router as question_router
from routes.users import router as user_router
from routes.save_users import router as save_users_router
from routes.admin import router as admin_router
from routes.session import router as session_router
from routes.exams import router as exam_router
from routes.fonts import router as fonts_router


# 初始化 FastAPI 應用
app = FastAPI(title="題庫系統")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.smartlearningzones.com"],  # 或 ['*'] 測試用
    allow_credentials=True,  # ✅ 重點！讓 cookie 能傳送
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RedisSessionMiddleware)

# Redis 配置
redis_url = 'redis://red-cvt7qth5pdvs739hg6o0:6379'  # 使用你自己的 Redis URL

# Redis 連接
@app.on_event("startup")
async def startup_event():
    # 配置 Redis 客戶端
    app.state.redis = redis.StrictRedis.from_url(redis_url)

    # 在啟動時啟動異步的資料庫同步任務
    asyncio.create_task(sync_databases_periodically())  # 創建異步任務並啟動

# 根路由重定向到靜態頁面
@app.get("/", response_class=RedirectResponse)
async def redirect_to_index():
    return RedirectResponse(url="/static/home.html")

# 更新 StaticFiles，關閉快取
app.mount("/static", StaticFiles(directory="static"), name="static")

# 載入 API 路由
app.include_router(question_router, prefix="/api/questions", tags=["Questions"])
app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(save_users_router, prefix="/api/save_users", tags=["Save Users"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(session_router, prefix="/api/session", tags=["session"])
app.include_router(exam_router, prefix="/api/exam", tags=["exam"])
app.include_router(fonts_router, prefix="/api/fonts", tags=["fonts"])

# 新增的測試路由
@app.get("/test/")
async def test_route():
    return {"message": "測試路由正常工作"}

# 持續執行的任務
async def sync_databases_periodically():
    while True:
        print("正在同步資料庫...")
        subprocess.run(["bash", "sync_db_to_github.sh"], check=True)
        await asyncio.sleep(36000)  # 每十小時同步一次，這裡使用異步 sleep

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

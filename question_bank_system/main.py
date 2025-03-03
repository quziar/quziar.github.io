from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from routes import question_router, user_router
from routes.admin import router as admin_router
from routes.users import router as user_router
from routes.questions import router as questions_router

app = FastAPI(title="題庫系統")

# 根路由重定向到靜態頁面
@app.get("/", response_class=RedirectResponse)
async def redirect_to_index():
    return RedirectResponse(url="/static/index.html")

# 更新 StaticFiles，關閉快取
app.mount("/static", StaticFiles(directory="static"), name="static")

# 載入 API 路由
app.include_router(question_router, prefix="/api/questions", tags=["Questions"])  # 確保這是您想保留的路由
app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(questions_router, prefix="/api/questions", tags=["Questions"])  # 這行可能是多餘的，根據需要保留

# 管理員路由
app.include_router(admin_router, prefix="/admin", tags=["Admin"])

# 新增的測試路由
@app.get("/test/")
async def test_route():
    return {"message": "測試路由正常工作"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

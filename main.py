from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

# 正確引入路由
from routes.questions import router as question_router
from routes.users import router as user_router
from routes.save_users import router as save_users_router
from routes.admin import router as admin_router

app = FastAPI(title="題庫系統")

# 根路由重定向到靜態頁面
@app.get("/", response_class=RedirectResponse)
async def redirect_to_index():
    return RedirectResponse(url="/static/index.html")

# 更新 StaticFiles，關閉快取
app.mount("/static", StaticFiles(directory="static"), name="static")

# 載入 API 路由
app.include_router(question_router, prefix="/api/questions", tags=["Questions"])
app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(save_users_router, prefix="/api/save_users", tags=["Save Users"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])

# 服務靜態檔案
app.mount("/static", StaticFiles(directory="static"), name="static")

# 新增的測試路由
@app.get("/test/")
async def test_route():
    return {"message": "測試路由正常工作"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

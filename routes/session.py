from fastapi import APIRouter, HTTPException
from starlette.requests import Request
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
import os

router = APIRouter()

# 確保您已經設置 SessionMiddleware
secret_key = os.urandom(24).hex()
app.add_middleware(SessionMiddleware, secret_key=secret_key, same_site="none", https_only=True)

@router.post("/login/{user_id}")
async def login(user_id: str, request: Request):
    # 設定 session
    request.session["currentUserID"] = user_id
    return JSONResponse(content={"message": f"使用者 {user_id} 已成功登入"})

@router.get("/get_user/")
async def get_user(request: Request):
    # 檢查 session
    current_user = request.session.get("currentUserID", None)
    if current_user is None:
        raise HTTPException(status_code=401, detail="未登入")
    return {"currentUserID": current_user}

@router.get("/logout/")
async def logout(request: Request):
    # 清除 session
    request.session.clear()
    return JSONResponse(content={"message": "已成功登出"})

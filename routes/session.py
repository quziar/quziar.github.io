from fastapi import APIRouter, Depends, HTTPException
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from fastapi.responses import JSONResponse
import os

# 正確引入 APIRouter
router = APIRouter()

# 設定 Session 中介層，`secret_key` 用來加密 Session 資料
# 確保 secret_key 是長且隨機的，這裡僅作為範例
secret_key = os.urandom(24).hex()  # 生成一個隨機的密鑰

@router.on_event("startup")
async def startup():
    # 這裡可以將 middleware 加入
    pass

# 登入處理（設定 currentUserID）
@router.post("/login/{user_id}")
async def login(user_id: str, request: Request):
    # 設定 currentUserID 到 Session
    request.session["currentUserID"] = user_id
    response = JSONResponse(content={"message": f"使用者 {user_id} 已成功登入"})
    
    # 設定 Cookie 屬性：HttpOnly 和 Secure
    response.set_cookie("session_id", value=user_id, httponly=True, secure=True, samesite="None")
    
    return response

# 取得 currentUserID
@router.get("/get_user/")
async def get_user(request: Request):
    current_user = request.session.get("currentUserID", None)
    if current_user is None:
        raise HTTPException(status_code=401, detail="未登入")
    return {"currentUserID": current_user}

# 登出處理，清除 Session 資料
@router.get("/logout/")
async def logout(request: Request):
    # 清除 Session
    request.session.clear()
    response = JSONResponse(content={"message": "已成功登出"})
    
    # 清除 Cookie
    response.delete_cookie("session_id")
    
    return response

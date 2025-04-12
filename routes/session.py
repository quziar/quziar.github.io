from fastapi import APIRouter, HTTPException
from starlette.requests import Request
from fastapi.responses import JSONResponse
from scripts.cookie_session import SECRET_KEY

router = APIRouter()

@router.post("/login/{user_id}")
async def login(user_id: str, request: Request):
    # 儲存使用者 ID 到 session
    request.state.session["currentUserID"] = user_id
    print(f"[DEBUG] SECRET_KEY: {SECRET_KEY}")
    return JSONResponse(content={"message": f"使用者 {user_id} 已成功登入"})

@router.get("/get_user/")
async def get_user(request: Request):
    # 從 session 取得當前使用者
    print(f"[DEBUG] SECRET_KEY: {SECRET_KEY}")
    current_user = request.state.session.get("currentUserID")
    if current_user is None:
        raise HTTPException(status_code=401, detail="未登入")
    return {"currentUserID": current_user}

@router.get("/logout/")
async def logout(request: Request):
    # 清除 session
    request.state.session.clear()
    return JSONResponse(content={"message": "已成功登出"})

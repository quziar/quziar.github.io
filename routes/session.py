from fastapi import APIRouter, HTTPException
from starlette.requests import Request
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/login/{user_id}")
async def login(user_id: str, request: Request):
    # 將 user_id 存入 session
    request.session["currentUserID"] = user_id
    
    # 在伺服器端打印訊息
    print(f"使用者 {user_id} 已成功登入")

    # 返回 JSON 回應
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

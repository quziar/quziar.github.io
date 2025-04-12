from fastapi import APIRouter, HTTPException
from starlette.requests import Request
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/login/{user_id}")
async def login(user_id: str, request: Request):
    try:
        request.state.session["currentUserID"] = user_id
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": "儲存 user_id 失敗"})

    try:
        return JSONResponse(content={"message": f"使用者 {user_id} 已成功登入"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": "回應生成失敗"})


@router.get("/get_user/")
async def get_user(request: Request):
    current_user = request.state.session.get("currentUserID")
    if current_user is None:
        raise HTTPException(status_code=401, detail="未登入")
    return {"currentUserID": current_user}

@router.get("/logout/")
async def logout(request: Request):
    request.state.session.clear()
    return JSONResponse(content={"message": "已成功登出"})

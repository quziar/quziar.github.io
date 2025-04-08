from fastapi import APIRouter, HTTPException
from starlette.requests import Request
from fastapi.responses import JSONResponse

router = APIRouter()

@app.post("/login/{user_id}")
async def login(user_id: str, request: Request):
    print(f"步驟 1: 收到登入請求，user_id={user_id}")

    # 嘗試將 user_id 存入 session
    try:
        request.session["currentUserID"] = user_id
        print("步驟 2: user_id 成功儲存到 session")
    except Exception as e:
        print(f"步驟 2: 儲存 user_id 進 session 失敗，錯誤訊息: {e}")
        return JSONResponse(status_code=500, content={"message": "儲存 user_id 失敗"})

    # 在伺服器端打印訊息
    print(f"步驟 3: 使用者 {user_id} 已成功登入")

    # 返回 JSON 回應
    try:
        response = JSONResponse(content={"message": f"使用者 {user_id} 已成功登入"})
        print("步驟 4: 回應成功生成")
        return response
    except Exception as e:
        print(f"步驟 4: 回應生成失敗，錯誤訊息: {e}")
        return JSONResponse(status_code=500, content={"message": "回應生成失敗"})


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

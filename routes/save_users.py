from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from scripts.save_users import upload_users  # 使用匯入的 upload_users
from scripts.userlogin import userlogin  # 使用匯入的 userlogin
from scripts.view_all_users import view_all_users  # 使用匯入的 view_all_users
from database import get_user_db  # 假設這是連接資料庫的函式
from scripts.update_password import update_user_password

router = APIRouter()

class User(BaseModel):
    username: str
    password: str
    identities: str = "學生"  # 預設為 '學生'

class UserList(BaseModel):
    users: list[User]

@router.get("/view_all_users/")
async def view_all_users_route():
    try:
        # 使用 view_all_users 函式來處理顯示所有使用者
        users = view_all_users()
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"無法載入使用者，錯誤詳情: {e}")

@router.post("/userlogin/")
async def user_login(user: User):
    try:
        result = userlogin(user.username, user.password)

        if result:  # result 是 dict，包含 username 和 identities
            return {"message": "登入成功", "identities": result['identities']}
        else:
            raise HTTPException(status_code=401, detail="密碼錯誤或帳號不存在")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登入過程中發生錯誤: {e}")


@router.post("/register/")
async def register_user(user: User):
    try:
        # 將使用者資料打包成 dict（包含密碼和身份）
        users = {
            user.username: {
                "password": user.password,
                "identities": user.identities
            }
        }

        upload_users(users)  # 呼叫上層的函式處理儲存
        return {"message": "註冊成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"註冊過程中發生錯誤: {e}")


@router.post("/update_password/")
async def update_password(request: User):
    try:
        success = update_user_password(request.username, request.password)
        if success:
            return {"message": f"使用者 {request.username} 的密碼已更新"}
        else:
            raise HTTPException(status_code=404, detail=f"使用者 {request.username} 不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"變更密碼過程中發生錯誤: {e}")
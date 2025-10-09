from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from scripts.save_users import upload_users
from scripts.userlogin import userlogin
from scripts.view_all_users import view_all_users
from scripts.update_password import update_user_password
from scripts.get_class import get_class
from scripts.create_class import create_class
from scripts.additional_class import additional_class
from scripts.remove_class import remove_class_from_all
from scripts.remove_student_class import remove_student_class

router = APIRouter()

class User(BaseModel):
    username: str
    password: str
    identities: str = "學生"  # 預設為 '學生'

class UserList(BaseModel):
    users: list[User]

class ClassadditionalRequest(BaseModel):
    usernames: List[str]
    class_name: str

class ClassCreateRequest(BaseModel):
    username: str
    class_name: str

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

@router.get("/get_class/")
async def get_class_route(username: str):
    try:
        user_class = get_class(username)
        return {"class": user_class}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"無法載入使用者，錯誤詳情: {str(e)}")

@router.post("/create_class/")
async def create_new_class(request: ClassCreateRequest):
    try:
        result_msg = create_class(request.username, request.class_name)
        
        if "成功加入" in result_msg:
            return {"message": result_msg}
        else:
            raise HTTPException(status_code=400, detail=result_msg)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"伺服器錯誤: {e}")

@router.post("/additional_class/")
async def additional_student_class(request: ClassadditionalRequest):
    try:
        failed_users = additional_class(request.usernames, request.class_name)

        if not failed_users:
            return {"message": "所有學生已成功加入班級"}
        else:
            raise HTTPException(
                status_code=400,
                detail=f"以下學生加入失敗: {', '.join(failed_users)}"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"伺服器錯誤: {e}")


@router.post("/remove_class/")
async def api_remove_class(class_name: str):
    try:
        failed_users = remove_class_from_all(class_name)
        return {"message": f"班級刪除完成"}
    except Exception as e:
        raise HTTPException(status_code=500)

@router.post("/remove_student_class/")
async def remove_class(request: ClassCreateRequest):
    try:
        result_msg = remove_student_class(request.username, request.class_name)
        return {"message": f"已移除該學生"}
    except Exception as e:
        raise HTTPException(status_code=500)
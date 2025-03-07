from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_user_db

router = APIRouter()

class User(BaseModel):
    username: str
    password: str

class UserList(BaseModel):
    users: list[User]

@router.post("/save_users/")
async def save_users(data: UserList, db=Depends(get_user_db)):
    try:
        with db as conn:
            cursor = conn.cursor()
            for user in data.users:
                # 檢查使用者是否已存在
                cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
                if cursor.fetchone():
                    # 更新密碼
                    cursor.execute("UPDATE users SET password = ? WHERE username = ?", (user.password, user.username))
                else:
                    # 插入新使用者
                    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (user.username, user.password))
            conn.commit()
        return {"message": "使用者資料已成功保存"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"資料庫錯誤: {e}")

@router.get("/view_all_users/")
async def view_all_users(db=Depends(get_user_db)):
    try:
        with db as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users")
            rows = cursor.fetchall()

            # 轉換查詢結果為字典格式
            users = [dict(row) for row in rows]
            return {"users": users}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"無法載入使用者，錯誤詳情: {e}")

@router.post("/userlogin/")
async def user_login(user: User, db=Depends(get_user_db)):
    try:
        with db as conn:
            cursor = conn.cursor()
            # 查詢資料庫中的使用者帳號和密碼
            cursor.execute("SELECT password FROM users WHERE username = ?", (user.username,))
            stored_password = cursor.fetchone()

            if stored_password is None:
                raise HTTPException(status_code=404, detail="帳號不存在")

            # 驗證密碼是否正確
            if stored_password[0] != user.password:
                raise HTTPException(status_code=401, detail="密碼錯誤")

            return {"message": "登入成功"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登入過程中發生錯誤: {e}")
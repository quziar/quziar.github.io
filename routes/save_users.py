from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_user_db

router = APIRouter()

class User(BaseModel):
    username: str
    password: str
    identities: str ="學生"

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
                    cursor.execute("INSERT INTO users (username, password, identities) VALUES (?, ?, ?)", (user.username, user.password, "學生"))
            conn.commit()
        return {"message": "使用者資料已成功保存"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"資料庫錯誤: {e}")

@router.get("/view_all_users/")
async def view_all_users(db=Depends(get_user_db)):
    try:
        with db as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, username, identities FROM users")  # 明確選取欄位
            rows = cursor.fetchall()

            # 轉換查詢結果為字典格式
            users = [{"id": row[0], "username": row[1], "identities": row[2]} for row in rows]
            return {"users": users}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"無法載入使用者，錯誤詳情: {e}")

@router.post("/userlogin/")
async def user_login(user: User, db=Depends(get_user_db)):
    try:
        with db as conn:
            cursor = conn.cursor()
            # 查詢資料庫中的使用者帳號、密碼和身份
            cursor.execute("SELECT password, identities FROM users WHERE username = ?", (user.username,))
            result = cursor.fetchone()

            if result is None:
                raise HTTPException(status_code=404, detail="帳號不存在")

            stored_password, identities = result  # 同時獲取密碼和身份欄位

            # 驗證密碼是否正確
            if stored_password != user.password:
                raise HTTPException(status_code=401, detail="密碼錯誤")

            # 返回身份信息
            return {"message": "登入成功", "identities": identities}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登入過程中發生錯誤: {e}")

@router.post("/register/")
async def register_user(user: User, db=Depends(get_user_db)):
    try:
        with db as conn:
            cursor = conn.cursor()
            # 檢查使用者是否已存在
            cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="該帳號已存在")

            # 插入新使用者，預設身份為學生
            cursor.execute("INSERT INTO users (username, password, identities) VALUES (?, ?, ?)", (user.username, user.password, user.identities))
            conn.commit()
            return {"message": "註冊成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"註冊過程中發生錯誤: {e}")

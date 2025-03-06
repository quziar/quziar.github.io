from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
import os
import sqlite3

router = APIRouter()

class User(BaseModel):
    username: str
    password: str

class UserList(BaseModel):
    users: list[User]

@router.post("/save_users/")
async def save_users(data: UserList):
    # 連接到使用者帳號資料庫
    user_db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'user_account.db')
    
    # 如果資料庫不存在則自動創建
    if not os.path.exists(user_db_path):
        with sqlite3.connect(user_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                )
            ''')
            conn.commit()

    # 連接資料庫
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
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
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"資料庫錯誤: {e}")

    finally:
        cursor.close()
        conn.close()

@router.get("/view_all_users/")
async def view_all_users():
    user_db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'user_account.db')
    
    # 確保資料庫存在
    if not os.path.exists(user_db_path):
        raise HTTPException(status_code=404, detail="資料庫不存在")

    # 連接到使用者資料庫
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM users")
        rows = cursor.fetchall()

        # 獲取欄位名稱
        columns = [column[0] for column in cursor.description]

        # 轉換為字典
        users = [dict(zip(columns, row)) for row in rows]

        return {"users": users}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"無法載入使用者，錯誤詳情: {e}")

    finally:
        cursor.close()
        conn.close()

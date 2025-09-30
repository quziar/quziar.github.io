import os
import sqlite3
import bcrypt
from database import USER_DB_PATH, get_user_db

# 哈希使用者密碼
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def update_user_password(username: str, new_password: str) -> bool:
    try:
        with get_user_db() as conn:
            cursor = conn.cursor()

            # 確認使用者存在
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cursor.fetchone()
            if not user:
                print(f"🚨 使用者 {username} 不存在")
                return False

            # 生成新的哈希密碼
            hashed_password = hash_password(new_password)

            # 更新密碼
            cursor.execute("UPDATE users SET password = ? WHERE username = ?", (hashed_password, username))
            conn.commit()
            print(f"✅ 使用者 {username} 的密碼已更新")
            return True

    except Exception as e:
        print(f"🚨 密碼更新失敗: {e}")
        return False

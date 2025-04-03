import os
import sqlite3
from database import get_user_db

def upload_users(users):
    try:
        with get_user_db() as conn:
            cursor = conn.cursor()
            
            for username, password in users.items():
                # 檢查使用者是否已經存在
                cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
                if cursor.fetchone():
                    print(f"使用者 {username} 已經存在，跳過.")
                else:
                    # 插入新使用者，若無 identities 則預設為 '學生'
                    cursor.execute("INSERT INTO users (username, password, identities) VALUES (?, ?, ?)", (username, password, "學生"))
                    print(f"使用者 {username} 已成功加入.")
            
            conn.commit()
    except Exception as e:
        print(f"🚨 發生錯誤: {e}")

if __name__ == "__main__":
    users = {
        "user1": "password123",
        "user2": "pass456"
    }
    upload_users(users)

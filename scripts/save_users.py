import os
import sqlite3
import bcrypt
from database import USER_DB_PATH, get_user_db

# 哈希使用者密碼
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def store_user_password(db_path, username, password, identities, user_class=""):
    hashed_password = hash_password(password)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, password, identities, class)
            VALUES (?, ?, ?, ?)
        ''', (username, hashed_password, identities, user_class))
        conn.commit()

def upload_users(users):
    try:
        with get_user_db() as conn:
            cursor = conn.cursor()
            
            for username, info in users.items():
                password = info["password"]
                identities = info.get("identities", "學生")
                user_class = info.get("class", "")

                # 檢查使用者是否已經存在
                cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
                if cursor.fetchone():
                    print(f"使用者 {username} 已經存在，跳過.")
                else:
                    # 插入新使用者
                    store_user_password(USER_DB_PATH, username, password, identities, user_class)
                    print(f"使用者 {username}（身份：{identities}, 班級：{user_class or '未指定'}）已成功加入.")
            
            conn.commit()
    except Exception as e:
        print(f"🚨 發生錯誤: {e}")

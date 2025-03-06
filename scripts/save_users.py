import sqlite3
from database import get_db_connection

def upload_users(users):
    # 使用者資料會是字典格式
    payload = {"users": [{"username": u, "password": p} for u, p in users.items()]}

    try:
        # 建立連接到使用者資料庫
        with sqlite3.connect(os.path.join(os.path.dirname(__file__), '..', 'database', 'user_account.db')) as conn:
            cursor = conn.cursor()
            
            for user in users:
                # 檢查使用者是否已經存在
                cursor.execute("SELECT id FROM users WHERE username = ?", (user,))
                if cursor.fetchone():
                    print(f"使用者 {user} 已經存在，跳過.")
                else:
                    # 插入新使用者
                    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (user, users[user]))
                    print(f"使用者 {user} 已成功加入.")
            
            # 提交更改
            conn.commit()

    except Exception as e:
        print(f"🚨 發生錯誤: {e}")

if __name__ == "__main__":
    users = {
        "user1": "password123",
        "user2": "pass456"
    }

    upload_users(users)

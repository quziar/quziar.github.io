import sqlite3
import json
from database import get_user_db

def create_class(username: str, new_class: str):
    try:
        with get_user_db() as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT class FROM users")
            all_classes = cursor.fetchall()

            for row in all_classes:
                class_json = row[0]
                classes = json.loads(class_json) if class_json else []
                if new_class in classes:
                    return f"班級 {new_class} 已註冊於其他使用者"

            cursor.execute("SELECT class FROM users WHERE username = ?", (username,))
            row = cursor.fetchone()
            if not row:
                return "找不到使用者"

            current_class = json.loads(row[0]) if row[0] else []

            current_class.append(new_class)
            cursor.execute(
                "UPDATE users SET class = ? WHERE username = ?",
                (json.dumps(current_class, ensure_ascii=False), username)
            )
            conn.commit()
            return f"班級 {new_class} 已成功加入 {username}"

    except Exception as e:
        return f"資料庫錯誤: {e}"
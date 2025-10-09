import sqlite3
import json
from database import get_user_db

def remove_student_class(username: str, class_to_remove: str):
    try:
        with get_user_db() as conn:
            cursor = conn.cursor()

            # 取得指定使用者的班級資料
            cursor.execute("SELECT class FROM users WHERE username = ?", (username,))
            row = cursor.fetchone()
            if not row:
                return False  # 找不到使用者

            # 解析 JSON，如果錯誤就當作空列表
            try:
                current_class = json.loads(row[0]) if row[0] else []
            except json.JSONDecodeError:
                current_class = []

            # 移除指定班級
            if class_to_remove in current_class:
                current_class.remove(class_to_remove)

            # 更新資料庫
            cursor.execute(
                "UPDATE users SET class = ? WHERE username = ?",
                (json.dumps(current_class, ensure_ascii=False), username)
            )
            conn.commit()
            return True

    except Exception as e:
        print(f"資料庫操作錯誤: {e}")
        return False

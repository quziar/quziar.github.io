import sqlite3
import json
from database import get_user_db

def remove_class_from_all(class_to_remove: str):
    failed_users = []

    try:
        with get_user_db() as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT username, class FROM users")
            rows = cursor.fetchall()

            for username, class_json in rows:
                # 安全解析 JSON，如果錯誤就當作空列表
                try:
                    current_class = json.loads(class_json) if class_json else []
                except json.JSONDecodeError:
                    current_class = []

                # 移除指定班級
                if class_to_remove in current_class:
                    current_class.remove(class_to_remove)
                    try:
                        cursor.execute(
                            "UPDATE users SET class = ? WHERE username = ?",
                            (json.dumps(current_class, ensure_ascii=False), username)
                        )
                    except Exception:
                        failed_users.append(username)

            conn.commit()

    except Exception as e:
        print(f"資料庫操作錯誤: {e}")
        # 若整個 try 失敗，全部使用者都算更新失敗
        return [row[0] for row in rows]

    return failed_users

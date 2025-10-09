import sqlite3
import json
from database import get_user_db

def additional_class(usernames: list[str], new_class: str):
    try:
        with get_user_db() as conn:
            cursor = conn.cursor()

            # 取得所有符合的使用者
            placeholders = ",".join(["?"] * len(usernames))
            cursor.execute(f"SELECT username, class FROM users WHERE username IN ({placeholders})", usernames)
            rows = cursor.fetchall()

            failed_users = []
            for username, class_json in rows:
                # 解析 JSON，如果是空就用空列表
                current_class = json.loads(class_json) if class_json else []

                # 避免重複加入
                if new_class not in current_class:
                    current_class.append(new_class)

                try:
                    # ✅ 保留 Unicode 原始字符，避免變成 \uXXXX
                    cursor.execute(
                        "UPDATE users SET class = ? WHERE username = ?",
                        (json.dumps(current_class, ensure_ascii=False), username)
                    )
                except Exception:
                    failed_users.append(username)

            conn.commit()
            return failed_users  # 返回更新失敗的使用者
    except Exception as e:
        print(f"資料庫錯誤: {e}")
        return usernames  # 如果整個 try 失敗，全部都算失敗
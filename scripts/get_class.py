import sqlite3
import json
from database import get_user_db

def get_class(username: str):
    try:
        with get_user_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT class FROM users WHERE username = ?", (username,))
            result = cursor.fetchone()

            if result and result[0]:
                # 將 JSON 字串轉為 Python 陣列
                return json.loads(result[0])
            else:
                return []  # 沒有班級就回傳空陣列
    except Exception as e:
        print(f"資料庫錯誤: {e}")
        raise

import sqlite3
from database import get_text_db

def view_exam():
    try:
        # 使用資料庫連線
        with get_text_db() as conn:
            # 直接使用 conn.execute()，不需要手動創建 cursor
            rows = conn.execute('SELECT * FROM exams').fetchall()

            # 透過 sqlite3.Row 直接返回字典格式
            result = [dict(row) for row in rows]

        # 顯示抓取的結果
        print(f"Found {len(result)} exams in the database.")

        return result

    except sqlite3.DatabaseError as db_error:
        # 捕捉資料庫錯誤，並顯示詳細的錯誤訊息
        raise Exception(f"資料庫錯誤: {str(db_error)}")

    except Exception as e:
        # 捕捉其他異常
        raise Exception(f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

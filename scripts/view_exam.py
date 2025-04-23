import sqlite3
from database import get_text_db

def view_exam(user):
    try:
        # 使用資料庫連線
        with get_text_db() as conn:
            # 使用 WHERE 條件過濾 creator_id
            conn.row_factory = sqlite3.Row  # 設定返回字典格式
            rows = conn.execute('SELECT * FROM exams WHERE creator_id = ?', (user,)).fetchall()

            # 將查詢結果轉為字典列表
            result = [dict(row) for row in rows]

        # 顯示抓取的結果
        print(f"Found {len(result)} exams created by user '{user}'.")

        return result

    except sqlite3.DatabaseError as db_error:
        raise Exception(f"資料庫錯誤: {str(db_error)}")

    except Exception as e:
        raise Exception(f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

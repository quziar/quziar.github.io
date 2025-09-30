import sqlite3
from database import get_save_db

def get_return(name: str):
    try:
        # 使用資料庫連線
        with get_save_db() as conn:
            rows = conn.execute('SELECT * FROM save WHERE username = ?', (name,)).fetchall()

            result = [dict(row) for row in rows]

        return result

    except sqlite3.DatabaseError as db_error:
        raise Exception(f"資料庫錯誤: {str(db_error)}")

    except Exception as e:
        raise Exception(f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

import sqlite3
from database import get_db_connection

def view_all_questions():
    try:
        # 使用資料庫連線
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM questions')
            rows = cursor.fetchall()

            # 獲取欄位名稱
            columns = [column[0] for column in cursor.description]

            # 將資料轉換為字典
            result = [dict(zip(columns, row)) for row in rows]

        # 顯示抓取的結果
        print(f"Found {len(result)} questions in the database.")
        
        return result

    except sqlite3.DatabaseError as db_error:
        # 捕捉資料庫錯誤，並顯示詳細的錯誤訊息
        raise Exception(f"資料庫錯誤: {str(db_error)}")

    except Exception as e:
        # 捕捉其他異常
        raise Exception(f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

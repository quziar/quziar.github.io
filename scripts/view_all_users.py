import sqlite3
from database import get_user_db

def view_all_users():
    try:
        # 使用資料庫連線
        with get_user_db() as conn:
            cursor = conn.cursor()
            # 修改為查詢 user 表
            cursor.execute('SELECT * FROM users')  # 假設資料表名為 'users'
            rows = cursor.fetchall()

            # 獲取欄位名稱
            columns = [column[0] for column in cursor.description]

            # 將資料轉換為字典
            result = [dict(zip(columns, row)) for row in rows]

        # 顯示抓取的結果
        print(f"Found {len(result)} users in the database.")
        
        return result

    except sqlite3.DatabaseError as db_error:
        # 捕捉資料庫錯誤，並顯示詳細的錯誤訊息
        raise Exception(f"資料庫錯誤: {str(db_error)}")

    except Exception as e:
        # 捕捉其他異常
        raise Exception(f"無法載入使用者，請稍後再試。錯誤詳情: {str(e)}")

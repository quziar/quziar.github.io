import sqlite3
from database import get_text_db

def view_exam_by_title(title: str):
    try:
        # 使用資料庫連線
        with get_text_db() as conn:
            # 根據標題搜尋考卷
            query = 'SELECT * FROM exams WHERE title = ?'
            rows = conn.execute(query, (title,)).fetchall()

            # 透過 sqlite3.Row 直接返回字典格式
            result = [dict(row) for row in rows]

        if not result:
            print("未找到匹配的考卷。")
            return []

        # 顯示抓取的結果
        print(f"Found {len(result)} exams with title '{title}' in the database.")
        
        # 假設每個考卷有一個 `questions` 欄位，這裡返回其內容
        # 可以根據你的資料結構進行修改
        questions = result[0].get('questions', [])
        return questions

    except sqlite3.DatabaseError as db_error:
        # 捕捉資料庫錯誤，並顯示詳細的錯誤訊息
        raise Exception(f"資料庫錯誤: {str(db_error)}")

    except Exception as e:
        # 捕捉其他異常
        raise Exception(f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

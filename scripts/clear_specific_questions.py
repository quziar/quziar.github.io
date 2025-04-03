import sqlite3
from database import get_question_db
import logging

# 定義刪除指定ID題目的函數
def delete_question_by_id(question_id: int):
    try:
        # 取得資料庫連線
        db_connection = get_question_db()
        conn = db_connection.get_connection()  # 使用 get_connection 取得資料庫連線
        cursor = conn.cursor()  # 取得游標
        print("正在連接到資料庫...")

        # 刪除指定ID的資料
        cursor.execute('DELETE FROM questions WHERE id = ?', (question_id,))
        print(f"刪除資料成功，ID: {question_id}")

        # 提交改動
        conn.commit()

    except Exception as e:
        print(f"發生錯誤：{e}")
        raise HTTPException(status_code=500, detail=f"刪除題目時發生錯誤，錯誤詳情: {str(e)}")
    finally:
        cursor.close()
        conn.close()
        print("資料庫連接已關閉。")
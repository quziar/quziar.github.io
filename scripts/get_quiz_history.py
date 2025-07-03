import json
import sqlite3
from database import get_history_db

def get_quiz_history(username: str):
    """從資料庫獲取該用戶的測驗歷史紀錄"""
    try:
        with get_history_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, username, question_number, selected_answer, date
                FROM history 
                WHERE username = ? 
                ORDER BY date DESC
            ''', (username,))
            history_records = cursor.fetchall()

            if not history_records:
                return {"success": True, "message": "沒有測驗歷史紀錄！", "history": []}

            history_list = []
            for record in history_records:
                history_id, username, question_number, selected_answer, date = record
                history_list.append({
                    "id": history_id,
                    "username": username,
                    "question_number": json.loads(question_number),
                    "selected_answer": json.loads(selected_answer),
                    "date": date
                })

            return {"success": True, "message": "成功獲取歷史紀錄", "history": history_list}

    except sqlite3.Error as e:
        print("資料庫查詢錯誤:", e)
        return {"success": False, "error": f"發生錯誤: {e}"}

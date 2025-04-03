import os
import sqlite3
from database import get_history_db

def get_quiz_history(username: str):
    """從資料庫獲取該用戶的測驗歷史紀錄"""
    try:
        with get_history_db() as conn:
            cursor = conn.cursor()

            # 獲取該使用者的測驗歷史
            cursor.execute('''
                SELECT id, username, score, incorrectCount, date 
                FROM history WHERE username = ? 
                ORDER BY date DESC
            ''', (username,))
            history_records = cursor.fetchall()

            if not history_records:
                return {"message": "沒有測驗歷史紀錄！", "history": []}

            # 查詢每個測驗的詳細題目結果
            history_list = []
            for record in history_records:
                history_id, username, score, incorrect_count, date = record
                
                # 查詢 details
                cursor.execute('''
                    SELECT question_number, selected_answer, correct_answer, is_correct, explanation
                    FROM history_details WHERE history_id = ?
                ''', (history_id,))
                details_records = cursor.fetchall()

                details_list = [
                    {
                        "questionNumber": detail[0],
                        "selectedAnswer": detail[1],
                        "correctAnswer": detail[2],
                        "isCorrect": bool(detail[3]),  # 轉換為布林值
                        "explanation": detail[4]
                    }
                    for detail in details_records
                ]

                history_list.append({
                    "id": history_id,
                    "username": username,
                    "score": score,
                    "incorrectCount": incorrect_count,
                    "date": date,
                    "details": details_list
                })

            return {"message": "成功獲取歷史紀錄", "history": history_list}
    
    except sqlite3.Error as e:
        # 捕捉資料庫錯誤並回報
        return {"error": f"發生錯誤: {e}"}

import os
import sqlite3
from database import get_history_db

def save_quiz_result(quiz_result: dict):
    """將測驗結果儲存到資料庫"""
    try:
        with get_history_db() as conn:
            cursor = conn.cursor()

            # 儲存 history 表格
            cursor.execute(''' 
                INSERT INTO history (username, score, incorrectCount, date) 
                VALUES (?, ?, ?, ?)
            ''', (quiz_result['username'], quiz_result['score'], quiz_result['incorrectCount'], quiz_result['date']))

            # 取得剛剛插入的 history id
            history_id = cursor.lastrowid

            # 儲存 history_details 表格
            for detail in quiz_result['details']:
                cursor.execute(''' 
                    INSERT INTO history_details (history_id, question_number, selected_answer, correct_answer, is_correct, explanation)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    history_id,
                    detail['questionNumber'],
                    detail['selectedAnswer'],
                    detail['correctAnswer'],
                    int(detail['isCorrect']),  # 轉換為 0 或 1
                    detail['explanation']
                ))

            conn.commit()

        return {"message": "Quiz result saved successfully", "history_id": history_id}

    except sqlite3.Error as e:
        # 如果發生錯誤，回滾並打印錯誤訊息
        if conn:
            conn.rollback()
        return {"error": f"An error occurred: {e}"}

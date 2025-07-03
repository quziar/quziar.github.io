import json
from database import get_history_db

def save_quiz_result(quiz_result: dict):
    """將測驗結果儲存到資料庫"""
    try:
        with get_history_db() as conn:
            cursor = conn.cursor()

            # 將列表物件轉成 JSON 字串
            question_number_json = json.dumps(quiz_result['questionNumber'])
            selected_answer_json = json.dumps(quiz_result['selectedAnswer'])

            cursor.execute(''' 
                INSERT INTO history (username, question_number, selected_answer, date) 
                VALUES (?, ?, ?, ?)
            ''', (
                quiz_result['username'],
                question_number_json,
                selected_answer_json,
                quiz_result['date']
            ))

            history_id = cursor.lastrowid
            conn.commit()

        return {"message": "Quiz result saved successfully", "history_id": history_id}

    except Exception as e:
        # 這裡改用一般 Exception 並印出錯誤，方便除錯
        print("Error saving quiz result:", e)
        raise

import sqlite3
from database import get_question_db

def update_question(question_id, updated_data):
    """
    根據題目 ID 更新題目資料，包含選項與正確答案。
    updated_data 範例：
    {
        "year": "2025",
        "category": "數學",
        "subject": "代數",
        "question_text": "新的題目文字",
        "option_a": "選項A",
        "option_b": "選項B",
        "option_c": "選項C",
        "option_d": "選項D",
        "correct_answer": "A"
    }
    """
    with get_question_db() as db:
        cursor = db.cursor()

        # 更新題目表
        update_query = """
            UPDATE questions
            SET year = ?, category = ?, subject = ?, question_text = ?,
                option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?
            WHERE id = ?
        """
        cursor.execute(update_query, (
            updated_data.get("year"),
            updated_data.get("category"),
            updated_data.get("subject"),
            updated_data.get("question_text"),
            updated_data.get("option_a"),
            updated_data.get("option_b"),
            updated_data.get("option_c"),
            updated_data.get("option_d"),
            updated_data.get("correct_answer"),
            question_id
        ))
        db.commit()

    return {"status": "success", "message": f"題目 {question_id} 已更新"}

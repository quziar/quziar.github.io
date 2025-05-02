import sqlite3
from database import get_question_db
from database import get_image_db

def fetch_questions_by_ids(id_list):
    """根據題目 ID 陣列從資料庫讀取題庫資料，並包含圖片路徑（如有）"""
    if not id_list:
        return []

    placeholders = ','.join(['?'] * len(id_list))

    with get_question_db() as db, get_image_db() as image_db:
        cursor = db.cursor()
        image_cursor = image_db.cursor()

        query = f"""
            SELECT id, year, category, subject, question_text, option_a, option_b, option_c, option_d, correct_answer
            FROM questions
            WHERE id IN ({placeholders})
        """
        cursor.execute(query, id_list)
        rows = cursor.fetchall()

        questions = []
        for row in rows:
            question_id = row[0]

            # 查詢圖片路徑（如有）
            image_cursor.execute('''
                SELECT image_path FROM question_images
                WHERE question_id = ?
            ''', (question_id,))
            image_result = image_cursor.fetchone()
            image_path = image_result[0] if image_result else ""

            correct_answer = row[9]
            answer_mapping = {"A": row[5], "B": row[6], "C": row[7], "D": row[8]}
            question_type = "選擇"
            gh_value = correct_answer

            if correct_answer in answer_mapping:
                answer = "有人想作弊，但我人很好，我不會告訴老師"
                gh_value = "有人想作弊，但我人很好，我不會告訴老師"
            elif correct_answer is None or correct_answer.strip() == "":
                answer = ""
                question_type = "申論"
                gh_value = ""
            else:
                answer = ""
                question_type = "申論"
                gh_value = ""

            questions.append({
                "year": row[1],
                "category": row[2],
                "subject": row[3],
                "questionNumber": question_id,
                "question": row[4],
                "options": [row[5], row[6], row[7], row[8]],
                "answer": answer,
                "marked": False,
                "markedSymbol": "",
                "answered": False,
                "type": question_type,
                "gh": gh_value,
                "eliminatedOptions": [],
                "image": image_path  # ← 加入圖片路徑
            })

        return questions

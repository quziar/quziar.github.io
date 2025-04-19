import random
from database import get_question_db  # 根據實際檔案路徑調整

def search_questions(subject, category, year, question_type, question_count):
    query = "SELECT id FROM questions WHERE 1=1"
    params = []

    if question_type and question_type != "選擇題":
        query += " AND correct_answer IS NOT NULL"
    else:
        query += " AND correct_answer IS NULL"

    if subject and subject != "全部":
        query += " AND subject = ?"
        params.append(subject)

    if category and category != "全部":
        query += " AND category = ?"
        params.append(category)

    if year and year != "全部":
        query += " AND year = ?"
        params.append(int(year))

    with get_question_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        question_ids = [row["id"] for row in rows]

    # 題數處理：亂數取出指定數量題目
    if question_count and question_count != "全部" and str(question_count).isdigit():
        count = int(question_count)
        random.shuffle(question_ids)
        question_ids = question_ids[:count]

    return question_ids

import random
from database import get_question_db

def search_questions(subject, category, year, question_type, question_count):
    query = "SELECT id FROM questions WHERE 1=1"
    params = []

    if question_type and question_type != "全部":
        if question_type == "選擇":
            query += " AND correct_answer IS NOT NULL"
        elif question_type == "申論":
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

    # 隨機取題（如果不是 "全部" 且是數字）
    if question_count and question_count != "全部" and str(question_count).isdigit():
        count = int(question_count)
        random.shuffle(question_ids)
        question_ids = question_ids[:count]

    return question_ids

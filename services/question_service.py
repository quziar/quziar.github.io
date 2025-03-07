from database import get_question_db

def fetch_all_questions():
    conn = get_question_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM questions")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_new_question(question):
    conn = get_question_db()
    cursor = conn.cursor()
    # 這裡以簡單方式儲存選項，將 list 用逗號分隔存入資料庫
    cursor.execute(
        "INSERT INTO questions (question, options, answer) VALUES (?, ?, ?)",
        (question.question, ",".join(question.options), question.answer)
    )
    conn.commit()
    question_id = cursor.lastrowid
    conn.close()
    return question_id

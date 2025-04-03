def clear_all_questions():
    conn = get_question_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM questions')
    cursor.execute('DELETE FROM sqlite_sequence WHERE name="questions"')
    conn.commit()
    cursor.close()
    conn.close()

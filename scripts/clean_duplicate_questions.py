from database import get_question_db

def clean_duplicate_questions():
    try:
        # 取得資料庫連線
        db_connection = get_question_db()
        conn = db_connection.get_connection()  # 使用 get_connection 取得資料庫連線
        cursor = conn.cursor()  # 取得游標
        print("正在連接到資料庫...")

        # 查詢資料庫中的所有題目
        cursor.execute('SELECT id, subject, year, category, question_text, option_a, option_b, option_c, option_d, correct_answer, public_private FROM questions')
        rows = cursor.fetchall()

        # 使用字典來跟蹤已出現的題目內容和對應的ID
        unique_questions = {}
        for row in rows:
            id, subject, year, category, question_text, option_a, option_b, option_c, option_d, correct_answer, public_private = row

            # 檢查是否已有相同的題目（對照所有欄位）
            question_key = (subject, year, category, question_text, option_a, option_b, option_c, option_d, correct_answer)
            if question_key in unique_questions:
                # 如果題目已存在於字典中，刪除重複的題目
                cursor.execute('DELETE FROM questions WHERE id = ?', (id,))
                print(f"刪除重複的題目，ID: {id}，內容：{row}")
            else:
                # 記錄完整的題目資料 (包括選項等)
                unique_questions[question_key] = {
                    'subject': subject,
                    'year': year,
                    'category': category,
                    'question_text': question_text,
                    'option_a': option_a,
                    'option_b': option_b,
                    'option_c': option_c,
                    'option_d': option_d,
                    'correct_answer': correct_answer,
                    'public_private': public_private
                }

        # 提交改動
        conn.commit()

        # 刪除所有資料
        cursor.execute('DELETE FROM questions')
        print("刪除所有資料完成。")

        # 重設自動增量ID
        cursor.execute('DELETE FROM sqlite_sequence WHERE name="questions"')
        print("重設自動增量ID完成。")

        # 將資料重新插入表中
        cursor.executemany('''
        INSERT INTO questions (subject, year, category, question_text, option_a, option_b, option_c, option_d, correct_answer, public_private)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', [
            (value['subject'], value['year'], value['category'], value['question_text'], value['option_a'], value['option_b'], value['option_c'], value['option_d'], value['correct_answer'], value['public_private'])
            for value in unique_questions.values()
        ])
        print("重新插入資料到原表中完成。")

        # 提交改動
        conn.commit()

    except Exception as e:
        print(f"發生錯誤：{e}")
    finally:
        cursor.close()
        conn.close()
        print("資料庫連接已關閉。")

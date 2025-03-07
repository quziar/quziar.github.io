from database import get_question_db

def clean_duplicate_questions():
    try:
        # 連接到資料庫
        conn = get_question_db()
        cursor = conn.cursor()
        print("正在連接到資料庫...")

        # 查詢資料庫中的所有題目
        cursor.execute('SELECT * FROM questions')
        rows = cursor.fetchall()

        # 使用字典來跟蹤已出現的題目內容和對應的ID
        unique_questions = {}
        for row in rows:
            id, question_text, option_a, option_b, option_c, option_d, correct_answer = row

            # 如果題目已存在於字典中，記錄當前ID以便刪除
            if question_text in unique_questions:
                cursor.execute('DELETE FROM questions WHERE id = ?', (id,))
                print(f"刪除重複的題目，ID: {id}，內容：{row}")
            else:
                unique_questions[question_text] = id

        # 提交改動
        conn.commit()

        # 刪除所有資料並重設自動增量ID
        cursor.execute('DELETE FROM questions')
        cursor.execute('DELETE FROM sqlite_sequence WHERE name="questions"')
        print("刪除所有資料並重設自動增量ID完成。")

        # 將資料重新插入表中
        cursor.executemany('''
        INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', [(key, row['option_a'], row['option_b'], row['option_c'], row['option_d'], row['correct_answer']) 
              for key, row in unique_questions.items()])
        print("重新插入資料到原表中完成。")

        # 提交改動
        conn.commit()

        # 重新查詢資料庫中的所有題目，並顯示結果
        cursor.execute('SELECT * FROM questions ORDER BY id')
        rows = cursor.fetchall()
        for row in rows:
            print(row)

    except Exception as e:
        print(f"發生錯誤：{e}")
    finally:
        cursor.close()
        conn.close()
        print("資料庫連接已關閉。")

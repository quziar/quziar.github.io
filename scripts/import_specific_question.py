import os
from database import get_question_db

def import_questions(data, public_private):
    try:
        # 取得資料庫連線
        db_connection = get_question_db()
        with db_connection as conn:
            cursor = db_connection.get_cursor()  # 使用 get_cursor() 獲取游標

            # 確保資料格式正確，並插入資料庫
            for row in data:
                if not row['question_text']:  # 如果題目內容為空，跳過
                    continue

                # 檢查資料庫中是否已存在相同的題目 (對照所有欄位)
                cursor.execute(''' 
                    SELECT id FROM questions 
                    WHERE subject = ? AND year = ? AND category = ? 
                    AND question_text = ? AND option_a = ? AND option_b = ? 
                    AND option_c = ? AND option_d = ? AND correct_answer = ?
                ''', (row['subject'], row['year'], row['category'], row['question_text'], 
                      row['option_a'], row['option_b'], row['option_c'], row['option_d'], row['correct_answer']))
                
                if cursor.fetchone():
                    # 如果資料庫中已存在完全相同的題目，則跳過
                    continue

                # 插入新題目
                cursor.execute(''' 
                    INSERT INTO questions (subject, year, category, question_text, option_a, option_b, option_c, option_d, correct_answer, public_private)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (row['subject'], row['year'], row['category'], row['question_text'], row['option_a'], 
                      row['option_b'], row['option_c'], row['option_d'], row['correct_answer'], public_private))

            # 提交變更
            conn.commit()

        return {"message": "題庫資料已成功導入！"}

    except Exception as e:
        # 處理錯誤並返回統一錯誤訊息
        return {"message": f"匯入失敗: {str(e)}"}

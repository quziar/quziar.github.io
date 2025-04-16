import os
from database import get_question_db

def import_questions(data, public_private):
    try:
        # 取得資料庫連線
        db_connection = get_question_db()
        with db_connection as conn:
            cursor = db_connection.get_cursor()  # 使用 get_cursor() 獲取游標

            # 記錄成功與失敗的計數
            success_count = 0
            skip_count = 0
            failure_count = 0
            failure_details = []  # 用於記錄失敗原因

            # 確保資料格式正確，並插入資料庫
            for index, row in enumerate(data, start=1):
                try:
                    if not row.get('question_text'):  # 如果題目內容為空，跳過
                        skip_count += 1
                        continue

                    # 檢查資料庫中是否已存在相同的題目
                    cursor.execute(''' 
                        SELECT id FROM questions 
                        WHERE subject = ? AND year = ? AND category = ? 
                        AND question_text = ? AND option_a = ? AND option_b = ? 
                        AND option_c = ? AND option_d = ? AND correct_answer = ?
                    ''', (
                        row['subject'], row['year'], row['category'], row['question_text'], 
                        row['option_a'], row['option_b'], row['option_c'], row['option_d'], 
                        row['correct_answer']
                    ))
                    
                    if cursor.fetchone():
                        skip_count += 1  # 題目已存在，跳過
                        continue

                    # 插入新題目
                    cursor.execute(''' 
                        INSERT INTO questions (
                            subject, year, category, question_text, 
                            option_a, option_b, option_c, option_d, 
                            correct_answer, public_private
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        row['subject'], row['year'], row['category'], row['question_text'], 
                        row['option_a'], row['option_b'], row['option_c'], row['option_d'], 
                        row['correct_answer'], public_private
                    ))
                    success_count += 1  # 成功插入

                except KeyError as ke:
                    failure_count += 1
                    failure_details.append(f"第 {index} 筆資料缺少欄位：{str(ke)}")
                except Exception as row_error:
                    failure_count += 1
                    failure_details.append(f"第 {index} 筆資料處理失敗：{str(row_error)}")

            # 提交變更
            conn.commit()

        # 回報結果
        result_message = f"導入完成：成功 {success_count} 筆，跳過 {skip_count} 筆，失敗 {failure_count} 筆"
        
        # 如果有失敗的詳細資料，附加在回應中
        if failure_details:
            result_message += "\n失敗詳情：\n" + "\n".join(failure_details)

        return {
            "message": result_message
        }

    except Exception as e:
        return {"message": f"資料庫處理失敗：{str(e)}"}

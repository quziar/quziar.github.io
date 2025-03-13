import os
import pandas as pd
from database import get_question_db

def import_questions_from_excel(file, public_private):
    try:
        # 儲存上傳的 Excel 檔案
        upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        excel_path = os.path.join(upload_dir, file.filename)

        # 儲存檔案到指定路徑
        with open(excel_path, "wb") as f:
            f.write(file.file.read())

        # 讀取 Excel 檔案
        df = pd.read_excel(excel_path)

        # 確保 Excel 檔案有所需的欄位
        required_columns = ['科目', '年度', '類別', '題目內容', 'A', 'B', 'C', 'D', '解答']
        if not all(col in df.columns for col in required_columns):
            raise ValueError("Excel file is missing required columns: 科目, 年度, 類別, 題目內容, A, B, C, D, 解答.")

        # 重新命名欄位為符合資料庫格式
        df = df[required_columns]
        df.columns = ['subject', 'year', 'category', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']

        # 取得資料庫連線並進行資料庫操作
        db_connection = get_question_db()
        with db_connection as conn:
            cursor = db_connection.get_cursor()  # 使用 get_cursor() 獲取游標

            # 插入資料庫
            for index, row in df.iterrows():
                if not row['question_text']:  # 如果題目內容為空，跳過
                    continue

                # 檢查資料庫中是否已存在相同的題目
                cursor.execute('SELECT id FROM questions WHERE question_text = ?', (row['question_text'],))
                if cursor.fetchone():
                    # 如果題目已存在，可以選擇更新或跳過
                    # 這裡刪除舊的題目，然後插入新的題目
                    cursor.execute('DELETE FROM questions WHERE question_text = ?', (row['question_text'],))

                # 插入新題目
                cursor.execute('''
                    INSERT INTO questions (subject, year, category, question_text, option_a, option_b, option_c, option_d, correct_answer, public_private)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (row['subject'], row['year'], row['category'], row['question_text'], row['option_a'], row['option_b'], row['option_c'], row['option_d'], row['correct_answer'], public_private))

            # 提交變更
            conn.commit()

        return {"message": "題庫資料已成功導入！"}

    except Exception as e:
        # 處理錯誤並返回統一錯誤訊息
        return {"message": f"上傳失敗: {str(e)}"}

import pandas as pd
import os
from database import get_db_connection

def import_questions_from_excel():
    try:
        excel_path = os.path.join(os.path.dirname(__file__), 'database', 'questions.xlsx')

        # 檢查 Excel 檔案是否存在
        if not os.path.exists(excel_path):
            raise FileNotFoundError("Excel file does not exist!")

        # 取得資料庫連線
        conn = get_db_connection()
        cursor = conn.cursor()

        # 讀取 Excel 檔案
        df = pd.read_excel(excel_path)

        # 確保 Excel 檔案有所需的欄位
        required_columns = ['題目內容', 'A', 'B', 'C', 'D', '解答']
        if not all(col in df.columns for col in required_columns):
            raise ValueError("Excel file is missing required columns.")

        # 重新命名欄位為符合資料庫格式
        df = df[required_columns]
        df.columns = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']

        # 插入資料庫
        for index, row in df.iterrows():
            if not row['question_text']:  # 如果題目內容為空，跳過
                continue

            # 檢查資料庫中是否已存在相同的題目
            cursor.execute('SELECT id FROM questions WHERE question_text = ?', (row['question_text'],))
            if cursor.fetchone():
                # 如果題目已存在，可以選擇更新或跳過
                cursor.execute('DELETE FROM questions WHERE question_text = ?', (row['question_text'],))

            # 插入新題目
            cursor.execute('''
                INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (row['question_text'], row['option_a'], row['option_b'], row['option_c'], row['option_d'], row['correct_answer']))

        # 提交變更並關閉資料庫連線
        conn.commit()
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")
        raise  # 重新拋出錯誤，讓呼叫者可以處理

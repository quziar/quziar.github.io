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
        df = pd.read_excel(excel_path, engine="openpyxl")

        # 1. 刪除完全空白的列
        df.dropna(axis=0, how='all', inplace=True)

        # 2. 確保 Excel 檔案有所需的欄位
        required_columns = ['科目', '年度', '類別', '題目內容', 'A', 'B', 'C', 'D', '解答']
        
        # 設定預設值，若缺少某些欄位則使用預設值
        missing_columns = set(required_columns) - set(df.columns)
        for col in missing_columns:
            df[col] = None  # 設定為 None 或者其他合適的預設值

        # 3. 重新命名欄位為符合資料庫格式
        # 動態處理欄位名稱
        column_map = {
            '科目': 'subject', 
            '年度': 'year', 
            '類別': 'category', 
            '題目內容': 'question_text',
            'A': 'option_a',
            'B': 'option_b',
            'C': 'option_c',
            'D': 'option_d',
            '解答': 'correct_answer'
        }
        
        # 只重命名存在的欄位
        df = df.rename(columns={col: column_map[col] for col in df.columns if col in column_map})

        # 4. 取得資料庫連線並進行資料庫操作
        db_connection = get_question_db()
        with db_connection as conn:
            cursor = db_connection.get_cursor()  # 使用 get_cursor() 獲取游標

            # 5. 插入資料庫
            for index, row in df.iterrows():
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
                ''', (row['subject'], row['year'], row['category'], row['question_text'], 
                      row['option_a'], row['option_b'], row['option_c'], row['option_d'], 
                      row['correct_answer'], public_private))

            # 提交變更
            conn.commit()

        return {"message": "題庫資料已成功導入！"}

    except Exception as e:
        # 處理錯誤並返回統一錯誤訊息
        return {"message": f"上傳失敗: {str(e)}"}

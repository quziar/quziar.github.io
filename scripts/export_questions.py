from database import get_question_db
import sqlite3
import pandas as pd
from io import BytesIO
from openpyxl import load_workbook
from scripts.view_all_questions import view_all_questions

# 欄位對應字典
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

def export_all_questions():
    try:
        # 獲取所有題目
        questions = view_all_questions()

        # 產生 DataFrame
        df = pd.DataFrame(questions)

        if df.empty:
            raise Exception("匯出檔案為空，無法下載")

        # 將 DataFrame 的欄位名稱轉換為中文
        df = df.rename(columns={v: k for k, v in column_map.items()})

        # 使用 BytesIO 在記憶體中創建 Excel 檔案
        excel_file = BytesIO()
        df.to_excel(excel_file, index=False, engine="openpyxl")

        # 使用 openpyxl 調整欄位寬度
        excel_file.seek(0)
        workbook = load_workbook(excel_file)
        sheet = workbook.active
        
        for col in sheet.columns:
            max_length = 0
            column = col[0].column_letter  # 獲取欄位的字母
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(cell.value)
                except:
                    pass
            adjusted_width = (max_length + 2)  # 自動設定寬度，留點空間
            sheet.column_dimensions[column].width = adjusted_width

        # 儲存更新過的 Excel 檔案
        updated_excel_file = BytesIO()
        workbook.save(updated_excel_file)
        updated_excel_file.seek(0)

        return updated_excel_file

    except Exception as e:
        raise Exception(f"匯出題目時發生錯誤: {str(e)}")

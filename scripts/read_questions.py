import sqlite3
import unicodedata
from database import get_question_db

def normalize_text(text):
    if text is None:
        return ""
    # 全形轉半形
    text = unicodedata.normalize("NFKC", text)
    # 移除空白（半形與全形）
    text = text.replace(" ", "").replace("\u3000", "")
    # 全部轉大寫
    return text.upper()

def fetch_questions():
    """從資料庫讀取題庫資料"""
    with get_question_db() as db:
        cursor = db.cursor()
        cursor.execute(
            "SELECT id, year, category, subject, question_text, option_a, option_b, option_c, option_d, correct_answer FROM questions"
        )
        rows = cursor.fetchall()

        questions = []
        for row in rows:
            # 先正規化正解
            correct_answer = normalize_text(row[9])

            # 先正規化選項
            option_a = normalize_text(row[5])
            option_b = normalize_text(row[6])
            option_c = normalize_text(row[7])
            option_d = normalize_text(row[8])

            answer_mapping = {"A": option_a, "B": option_b, "C": option_c, "D": option_d}
            question_type = "選擇"
            gh_value = correct_answer

            if correct_answer in answer_mapping:
                answer = answer_mapping[correct_answer]
            elif correct_answer == "":
                answer = ""
                question_type = "申論"
                gh_value = ""
            else:
                answer = correct_answer

            questions.append({
                "year": row[1],
                "category": row[2],
                "subject": row[3],
                "questionNumber": row[0],
                "question": row[4],
                # 這裡保留原始顯示用選項，但比對時用正規化
                "options": [row[5], row[6], row[7], row[8]],
                "answer": answer,
                "marked": False,
                "markedSymbol": "",
                "answered": False,
                "type": question_type,
                "gh": gh_value,
                "eliminatedOptions": []
            })

        return questions

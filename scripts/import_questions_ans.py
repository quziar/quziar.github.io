import sqlite3
from database import get_question_db
import unicodedata

def to_halfwidth(s):
    return unicodedata.normalize('NFKC', s)


def fetch_answers_by_ids(id_list):
    """根據題目 ID 陣列從資料庫讀取並回傳 answer 和 gh"""
    if not id_list:
        # 如果 id_list 為空，直接返回空陣列
        return []

    # 使用 placeholders 防止 SQL 注入攻擊
    placeholders = ','.join(['?'] * len(id_list))

    try:
        with get_question_db() as db:
            cursor = db.cursor()
            query = f"""
                SELECT id, option_a, option_b, option_c, option_d, correct_answer
                FROM questions
                WHERE id IN ({placeholders})
            """
            cursor.execute(query, id_list)
            rows = cursor.fetchall()

            result = []
            for row in rows:
                qid = row[0]
                options = {"A": row[1], "B": row[2], "C": row[3], "D": row[4]}
                if raw_answer is not None:
                    correct_answer = to_halfwidth(raw_answer.strip().upper())
                else:
                    correct_answer = ""

                # 確認正確答案是否存在於選項中
                if correct_answer in options:
                    answer = options[correct_answer]
                    gh = correct_answer
                else:
                    answer = ""
                    gh = ""

                result.append({
                    "answer": answer,
                    "gh": gh
                })

            return result

    except sqlite3.Error as e:
        # 捕捉任何資料庫錯誤
        print(f"資料庫錯誤: {e}")
        return []

import sqlite3
from database import get_question_db

def get_question_by_id(question_id: int):
    try:
        with get_question_db() as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                'SELECT * FROM questions WHERE id = ?',
                (question_id,)
            ).fetchone()

            if row is None:
                raise Exception(f"找不到 ID 為 {question_id} 的題目")

            return dict(row)

    except sqlite3.DatabaseError as db_error:
        raise Exception(f"資料庫錯誤: {str(db_error)}")

    except Exception as e:
        raise Exception(f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

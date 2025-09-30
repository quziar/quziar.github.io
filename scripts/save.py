import json
from datetime import datetime, timedelta
from database import get_save_db

def save(creator_id: str, question_number: list[int], selected_answer: list[str], duration: int):
    """將測驗答案暫存至資料庫（避免重複存入相同資料）"""
    try:
        with get_save_db() as conn:
            cursor = conn.cursor()

            # 陣列轉 JSON
            question_number_str = json.dumps(question_number, ensure_ascii=False)
            selected_answer_str = json.dumps(selected_answer, ensure_ascii=False)

            # 計算結束時間
            if duration == -1:
                # duration=-1 → 加 100 年
                endtime_dt = datetime.now() + timedelta(days=365*100)
            else:
                # 正常 duration 秒數
                endtime_dt = datetime.now() + timedelta(seconds=duration)

            endtime = endtime_dt.strftime("%Y-%m-%d %H:%M:%S")

            # 先檢查是否已存在相同使用者 & 題號
            cursor.execute("""
                SELECT id FROM save
                WHERE username = ? AND question_number = ?
            """, (creator_id, question_number_str))

            existing = cursor.fetchone()

            if existing:
                # 已存在 → 更新答案與時間
                cursor.execute("""
                    UPDATE save
                    SET selected_answer = ?, endtime = ?
                    WHERE id = ?
                """, (selected_answer_str, endtime, existing[0]))
            else:
                # 不存在 → 新增
                cursor.execute("""
                    INSERT INTO save (username, question_number, selected_answer, endtime)
                    VALUES (?, ?, ?, ?)
                """, (creator_id, question_number_str, selected_answer_str, endtime))

            conn.commit()

        return {"message": "已儲存"}

    except Exception as e:
        print("Error saving quiz result:", e)
        raise

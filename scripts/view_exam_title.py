import sqlite3
from database import get_text_db
from datetime import datetime, timezone, timedelta

def view_exam_title():
    try:
        with get_text_db() as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute('SELECT * FROM exams').fetchall()

            # 取得目前台灣時間（UTC+8），並轉為 naive datetime
            now = datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=8)))
            now_naive = now.replace(tzinfo=None)

            result = []

            for row in rows:
                try:
                    start_time_str = row['start_time']
                    # 將 ISO 格式的 UTC 字串轉為 datetime，然後轉為台灣時間，再變成 naive
                    start_time = datetime.fromisoformat(start_time_str.replace("Z", "+00:00")) \
                        .astimezone(timezone(timedelta(hours=8))) \
                        .replace(tzinfo=None)

                    if start_time <= now_naive:
                        result.append(dict(row))
                except Exception as e:
                    print(f"Error parsing start_time: {row['start_time']} - {e}")
                    continue

        print(f"Found {len(result)} valid exams in the database.")
        return result

    except sqlite3.DatabaseError as db_error:
        print(f"[DB Error] {db_error}")
        raise Exception(f"資料庫錯誤: {str(db_error)}")

    except Exception as e:
        print(f"[Unhandled Error] {e}")
        raise Exception(f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

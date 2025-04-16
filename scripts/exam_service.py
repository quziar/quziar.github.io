import json
import logging
from datetime import datetime, timedelta
from database import get_user_db, get_text_db
from starlette.concurrency import run_in_threadpool

# 日誌設定
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

DEFAULT_DURATION = 3600
TIMEZONE_OFFSET = timedelta(hours=8)
TIME_FORMAT = "%Y-%m-%d %H:%M:%S"

# 創建考卷
async def create_exam(creator_id: str, selected_questions: list[int], title: str, duration: int = None, start_time: str = None) -> int:
    print(start_time);
    # 驗證使用者是否存在
    def get_user():
        with get_user_db() as conn:
            return conn.execute("SELECT username FROM users WHERE username = ?", (creator_id,)).fetchone()
    
    # 使用線程池來執行同步的 get_user 函數
    user = await run_in_threadpool(get_user)
    if not user:
        logger.error(f"使用者 {creator_id} 不存在")
        raise Exception("使用者不存在")
    
    # 驗證資料
    if not selected_questions or not all(isinstance(q, int) for q in selected_questions):
        raise Exception("選擇的題目應為整數列表")
    if not title.strip():
        raise Exception("考試標題無效")

    duration = duration or DEFAULT_DURATION
    questions_json = json.dumps(selected_questions)

    # 插入資料
    def insert_exam():
        with get_text_db() as conn:
            created_at = (datetime.utcnow() + TIMEZONE_OFFSET).strftime(TIME_FORMAT)
            cursor = conn.cursor()
            cursor.execute(''' 
                INSERT INTO exams (title, creator_id, questions, created_at, start_time, duration)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (title, creator_id, questions_json, created_at, start_time, duration))
            conn.commit()
            return cursor.lastrowid

    # 使用線程池執行同步的插入操作
    return await run_in_threadpool(insert_exam)

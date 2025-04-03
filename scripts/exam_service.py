import json
import logging
from database import get_user_db, get_text_db
from starlette.concurrency import run_in_threadpool

# 設置日誌記錄
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

# 將 create_exam 設為異步函數
async def create_exam(creator_id, selected_questions: list) -> int:
    # 檢查使用者是否存在
    def _get_user_db():
        with get_user_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT username FROM users WHERE username = ?", (creator_id,))
            return cursor.fetchone()
    
    user = await run_in_threadpool(_get_user_db)

    # Log 輸出檢查
    if user:
        logger.debug(f"找到使用者: {user}")
    else:
        logger.error(f"使用者 {creator_id} 不存在於資料庫")
    
    if not user:
        raise Exception("使用者不存在")

    # 檢查 selected_questions 是否為列表
    if not isinstance(selected_questions, list):
        raise Exception("選擇的題目格式錯誤，應為列表")
    
    if not all(isinstance(q, int) for q in selected_questions):
        raise Exception("選擇的題目格式錯誤，應為整數列表")
    
    # 將選擇的題目列表轉換為 JSON 字串
    try:
        questions_json = json.dumps(selected_questions)
    except TypeError as e:
        raise Exception(f"無法轉換題目為 JSON 格式: {e}")

    # 將考卷資料插入到 `exams` 表中
    def _insert_exam():
        with get_text_db() as conn:  # 使用同步的 with 語句
            cursor = conn.cursor()  # 使用資料庫連接來創建 cursor
            cursor.execute(''' 
                INSERT INTO exams (creator_id, questions)
                VALUES (?, ?)
            ''', (creator_id, questions_json))
            conn.commit()

            # 返回插入的考卷ID
            return cursor.lastrowid

    # 等待插入操作完成並返回結果
    return await run_in_threadpool(_insert_exam)

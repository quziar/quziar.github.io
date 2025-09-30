from fastapi import APIRouter, HTTPException, status
from scripts.exam_service import create_exam
from scripts.view_exam import view_exam
from scripts.start_exam import view_exam_by_title
from scripts.view_exam_title import view_exam_title
from scripts.view_exam_duration_by_title import view_exam_duration_by_title
from pydantic import BaseModel
from typing import List, Optional
import logging
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta

router = APIRouter()

# 定義傳遞給 API 的請求數據模型
class GenerateExamRequest(BaseModel):
    title: str
    creator_id: str  # 使用者 ID 為字串
    selectedQuestions: List[int]  # 被選擇的題目 ID 列表
    duration: Optional[int] = 3600  # 作答時間，默認為 3600 秒（1 小時）
    start_time: Optional[str] = None  # 開始考試時間，預設為 None

    # 確保 start_time 在沒有提供時會使用默認時間
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.start_time is None:
            now = datetime.utcnow() + timedelta(hours=8)
            self.start_time = now.replace(second=0, microsecond=0).strftime("%Y-%m-%d %H:%M:%S")
class SaveData(BaseModel):
    creator_id: str
    question_number: list[int]
    selected_answer: list[str]
    duration: int
class UserRequest(BaseModel):
    user: str

# 設置日誌記錄
logger = logging.getLogger(__name__)

# 路由處理生成考卷的請求
@router.post("/generate-exam", status_code=status.HTTP_201_CREATED)
async def generate_exam(request: GenerateExamRequest):
    try:
        # 呼叫 create_exam 方法來生成考卷
        exam_id = await create_exam(
            request.creator_id,
            request.selectedQuestions,
            request.title,
            request.duration,
            request.start_time
        )

        return JSONResponse(content={"message": "考卷已成功生成！", "exam_id": exam_id}, status_code=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"生成考卷時發生錯誤: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"生成考卷時發生錯誤: {str(e)}")

# 查看考卷
@router.post("/view_exam/")
async def api_view_exam(request: UserRequest):
    try:
        exams = view_exam(request.user)
        return {"exams": exams}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# 查看考卷標題
@router.get("/view_exam_title/")
async def get_exam_title():
    try:
        text = view_exam_title()
        return JSONResponse(content={"exams": text}, status_code=200)
    except Exception as e:
        logger.error(f"錯誤詳情: {str(e)}")
        raise HTTPException(status_code=500, detail=f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

# 回傳題目列表
@router.get("/start_exam")
async def get_exam_by_title(title: str):
    try:
        questions = view_exam_by_title(title)
        return {"questions": questions}
    except Exception as e:
        return {"error": str(e)}

# 回傳題目列表
@router.get("/exam_duration")
async def get_exam_duration_by_title(title: str):
    try:
        duration = view_exam_duration_by_title(title)
        print(duration)
        return {"duration": duration}
    except Exception as e:
        return {"error": str(e)}
    
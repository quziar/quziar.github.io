from fastapi import APIRouter, HTTPException, status
from scripts.exam_service import create_exam
from scripts.view_exam import view_exam
from pydantic import BaseModel
from typing import List
import logging
from fastapi.responses import JSONResponse

router = APIRouter()

# 定義傳遞給 API 的請求數據模型
class GenerateExamRequest(BaseModel):
    title: str
    creator_id: str  # 使用者 ID 為字串
    selectedQuestions: List[int]  # 被選擇的題目 ID 列表

# 設置日誌記錄
logger = logging.getLogger(__name__)

# 路由處理生成考卷的請求
@router.post("/generate-exam", status_code=status.HTTP_201_CREATED)
async def generate_exam(request: GenerateExamRequest):
    logger.debug(f"收到生成考卷請求: {request}")

    try:
        # 檢查 creator_id 是否是字串
        if not isinstance(request.creator_id, str):
            logger.error(f"creator_id 格式錯誤: {request.creator_id}")
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="creator_id 必須是字串")

        # 檢查 selectedQuestions 是否是整數列表
        if not isinstance(request.selectedQuestions, list) or not all(isinstance(q, int) for q in request.selectedQuestions):
            logger.error(f"selectedQuestions 格式錯誤: {request.selectedQuestions}")
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="selectedQuestions 必須是整數列表")

        # 檢查 title 是否為非空字串
        if not request.title or not request.title.strip():
            logger.error("title 為空或無效")
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="title 必須是非空字串")

        # 呼叫 create_exam 方法來生成考卷
        exam_id = await create_exam(
            request.creator_id,
            request.selectedQuestions,
            request.title  # <--- 傳入 title
        )

        return JSONResponse(content={"message": "考卷已成功生成！", "exam_id": exam_id}, status_code=status.HTTP_201_CREATED)

    except HTTPException as http_error:
        logger.error(f"HTTP 錯誤: {http_error.detail}")
        raise http_error
    except Exception as e:
        logger.error(f"生成考卷時發生錯誤: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"生成考卷時發生錯誤: {str(e)}")


# 查看考卷
@router.get("/view_exam/")
async def get_exam():
    try:
        text = view_exam()
        return JSONResponse(content={"exams": text}, status_code=200)
    except Exception as e:
        logger.error(f"錯誤詳情: {str(e)}")
        raise HTTPException(status_code=500, detail=f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

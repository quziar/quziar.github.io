from fastapi import APIRouter, HTTPException
from scripts.view_all_questions import view_all_questions
from scripts.import_questions import import_questions_from_excel
from scripts.clean_duplicate_questions import clean_duplicate_questions
from scripts.clear_specific_questions import delete_question_by_id
from scripts.export_questions import export_all_questions
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi import File, Form, UploadFile
from io import BytesIO
from pydantic import BaseModel
from fastapi.responses import FileResponse
from openpyxl import load_workbook
import pandas as pd
import logging

router = APIRouter()

# 定義一個 Pydantic 模型來驗證請求體
class DeleteQuestionRequest(BaseModel):
    question_id: int

# 設置日誌
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 查看所有題目
@router.get("/view_all_questions/")
async def get_all_questions():
    logger.debug("view_all_questions 路由被觸發")
    try:
        questions = view_all_questions()
        logger.debug(f"查詢到 {len(questions)} 條題目")
        return JSONResponse(content={"questions": questions}, status_code=200)
    except Exception as e:
        logger.error(f"錯誤詳情: {str(e)}")
        raise HTTPException(status_code=500, detail=f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")

# 清空所有題目
@router.post("/clear-all-questions/")
async def clear_all():
    try:
        clear_all_questions()
        return JSONResponse(content={"message": "所有題目已清空！"}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清空題目時發生錯誤，請稍後再試。錯誤詳情: {str(e)}")

# 匯入題目
@router.post("/import-questions/")
async def import_questions(file: UploadFile = File(...), public_private: str = Form(...)):
    try:
        # 呼叫 import_questions_from_excel 函式並傳入檔案與公私有參數
        result = import_questions_from_excel(file, public_private)
        
        # 根據 import_questions_from_excel 的結果回應
        if "message" in result:
            return JSONResponse(content=result, status_code=201)
        else:
            raise HTTPException(status_code=500, detail=f"匯入題目時發生錯誤，請稍後再試。錯誤詳情: {result['message']}")

    except Exception as e:
        # 捕捉並處理異常
        raise HTTPException(status_code=500, detail=f"匯入題目時發生錯誤，請稍後再試。錯誤詳情: {str(e)}")

# 整理所有題目
@router.post("/clean-duplicate-questions/")
async def clean_duplicates():
    try:
        clean_duplicate_questions()
        return JSONResponse(content={"message": "重複題目已清理！"}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"整理重複題目時發生錯誤，請稍後再試。錯誤詳情: {str(e)}")

# 匯出所有題目
@router.get("/export")
async def export_questions():
    try:
        # 直接呼叫在 scripts 中的函數來處理匯出
        updated_excel_file = export_all_questions()

        return StreamingResponse(updated_excel_file, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=questions_export.xlsx"})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"匯出題目時發生錯誤: {str(e)}")

#刪除特定題目
@router.post("/delete-question/")
async def delete_question(request: DeleteQuestionRequest):
    try:
        delete_question_by_id(request.question_id)
        return JSONResponse(content={"message": f"題目ID {request.question_id} 已成功刪除！"}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"刪除題目時發生錯誤，請稍後再試。錯誤詳情: {str(e)}")

#新增題目
@router.post("/import-questions/")
async def import_single_question(
    question: QuestionData, 
    public_private: str = Form(...)
):
    try:
        # 呼叫 import_questions 函式並傳入單一題目的資料與公私有參數
        result = import_questions([question.dict()], public_private)

        # 根據 import_questions 函式的結果回應
        if "message" in result:
            return JSONResponse(content=result, status_code=201)
        else:
            raise HTTPException(status_code=500, detail=f"匯入題目時發生錯誤，請稍後再試。錯誤詳情: {result['message']}")

    except Exception as e:
        # 捕捉並處理異常
        raise HTTPException(status_code=500, detail=f"匯入題目時發生錯誤，請稍後再試。錯誤詳情: {str(e)}")

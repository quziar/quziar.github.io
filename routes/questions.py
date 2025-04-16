from fastapi import APIRouter, HTTPException, Depends
from scripts.view_all_questions import view_all_questions
from scripts.import_questions import import_questions_from_excel
from scripts.import_specific_question import import_questions
from scripts.clean_duplicate_questions import clean_duplicate_questions
from scripts.clear_specific_questions import delete_question_by_id
from scripts.export_questions import export_all_questions
from scripts.read_questions import fetch_questions
from scripts.save_quiz_result import save_quiz_result
from scripts.get_quiz_history import get_quiz_history
from scripts.get_question_by_id import get_question_by_id
from scripts.fetch_questions_by_ids import fetch_questions_by_ids
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi import File, Form, UploadFile
from io import BytesIO
from pydantic import BaseModel
from fastapi.responses import FileResponse
from openpyxl import load_workbook
import pandas as pd
import logging
from typing import List, Optional
import json
from fastapi import Request


router = APIRouter()

# 定義一個 Pydantic 模型來驗證請求體
class DeleteQuestionRequest(BaseModel):
    
    question_id: int

# 構建要傳送的題目資料
class QuestionData(BaseModel):
    subject: str
    year: int
    category: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str

class QuizDetail(BaseModel):
    questionNumber: int
    selectedAnswer: Optional[str]
    correctAnswer: str
    isCorrect: bool
    explanation: Optional[str] = "無詳解"

class QuizResult(BaseModel):
    username: str
    score: float
    incorrectCount: int
    date: str
    details: List[QuizDetail]

class IdsRequest(BaseModel):
    ids: List[int]

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

#讀取題目
@router.get("/read_questions")
def get_questions():
    """API 端點：取得題庫資料"""
    questions = fetch_questions()
    return {"questions": questions}

#儲存測驗結果
@router.post("/save_quiz_result")
def save_result(quiz_result: QuizResult):
    """API: 儲存測驗結果"""
    try:
        save_quiz_result(quiz_result.dict())  # 確保正確傳入 dict
        return {"message": "測驗結果已儲存"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#獲得測驗紀錄
@router.get("/get_quiz_history/{username}")
def get_history(username: str):
    """API：獲取該使用者的測驗歷史紀錄"""
    return get_quiz_history(username)

#查看單題
@router.get("/view_questions/{question_id}")
def get_single_question(question_id: int):
    try:
        question = get_question_by_id(question_id)
        return question
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

#回傳題目
@router.post("/fetch_by_ids")
async def fetch_by_ids(request: IdsRequest):
    try:
        questions = fetch_questions_by_ids(request.ids)
        return { "questions": questions }
    except Exception as e:
        return { "error": str(e) }

#新增題目
@router.post("/import-single-question")
async def import_single_question(
    request: Request  # 使用 Request 來取得原始請求資料
):
    try:
        # 解析 JSON 請求體
        body = await request.json()  # 這樣可以直接獲得請求的 JSON 資料

        # 從 JSON 中取出問題資料與公私有選項
        question_data = body.get("question")
        public_private = body.get("public_private")

        # 檢查必填資料是否存在
        if not question_data or not public_private:
            return JSONResponse(status_code=400, content={"message": "缺少必要的資料"})

        # 若是單筆也要轉為 list 結構，統一處理邏輯
        if isinstance(question_data, dict):
            question_data = [question_data]

        # 等待 import_questions 函數的結果
        result = await import_questions(question_data, public_private)
        return JSONResponse(content=result)

    except json.JSONDecodeError:
        return JSONResponse(status_code=400, content={"message": "題目資料格式錯誤，請確認 JSON 是否正確。"})

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"匯入過程發生錯誤: {str(e)}"})
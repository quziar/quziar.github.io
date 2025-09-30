from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from scripts.save import save
from scripts.view_all_save import view_all_save
from scripts.get_return import get_return

router = APIRouter()

class SaveData(BaseModel):
    creator_id: str
    question_number: list[int]
    selected_answer: list[str]
    duration: int
# 定义请求体模型
class RequestModel(BaseModel):
    name: str

@router.post("/save")
async def save_data(data: SaveData):
    try:
        result = save(
            creator_id=data.creator_id,
            question_number=data.question_number,
            selected_answer=data.selected_answer,
            duration=data.duration
        )
        return result
    except Exception as e:
        return {"message": f"保存失敗：{str(e)}"}

@router.get("/view_all_save/")
async def get_all_save():
    try:
        all_saves = view_all_save()
        return JSONResponse(content={"save": all_saves}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")
# 根據考卷名稱取得題目
@router.post("/load")
async def start_exam(request: RequestModel):
    try:
        saves = get_return(request.name)
        return JSONResponse(content={"save": saves}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"無法載入題目，請稍後再試。錯誤詳情: {str(e)}")
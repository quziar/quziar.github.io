from fastapi import APIRouter, Response
from pathlib import Path

router = APIRouter()

FONT_PATH = Path(__file__).parent.parent / "database" / "NotoSansCJKtc-VF.ttf"

@router.get("/fontnoto")
async def get_noto_sans_font():
    if not FONT_PATH.is_file():  # 檢查是否為有效檔案
        return Response(content="Font file not found", status_code=404)
    
    return Response(content=FONT_PATH.read_bytes(), media_type="font/ttf")

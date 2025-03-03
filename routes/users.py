from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def read_users():
    return {"user": "user_info"}

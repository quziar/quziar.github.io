from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

router = APIRouter()

@router.get("/admin_dashboard.html", response_class=HTMLResponse)
async def admin_dashboard():
    return HTMLResponse(content=open("static/admin_dashboard.html", "r", encoding="utf-8").read())

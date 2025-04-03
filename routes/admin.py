from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter()

# /admin 路由進行重定向
@router.get("/admin/")
async def redirect_to_admin_dashboard():
    # 重定向到 /static/admin_dashboard.html
    return RedirectResponse(url="/static/admin_dashboard.html")

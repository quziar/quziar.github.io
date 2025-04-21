from .questions import router as question_router
from .save_users import router as save_users_router
from .admin import router as admin_router
from .session import router as session_router
from .exams import router as exam_router
from .fonts import router as fonts_router

# 方便 main.py 載入
__all__ = ["question_router","save_users_router","admin_router","session_router","exam_router","fonts_router"]

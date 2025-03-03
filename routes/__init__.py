from .questions import router as question_router
from .users import router as user_router

# 方便 main.py 載入
__all__ = ["question_router", "user_router"]

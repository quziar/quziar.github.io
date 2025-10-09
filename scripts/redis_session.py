import uuid
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# 簡單的全域 session 儲存（注意：多執行緒或多進程時會失效）
SESSION_STORE = {}

class MemorySessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, session_cookie: str = "session_id"):
        super().__init__(app)
        self.session_cookie = session_cookie

    async def dispatch(self, request: Request, call_next):
        session_id = request.cookies.get(self.session_cookie)

        if not session_id or session_id not in SESSION_STORE:
            session_id = str(uuid.uuid4())
            SESSION_STORE[session_id] = {}

        # 從記憶體中讀取 session
        session = SESSION_STORE.get(session_id, {})

        # 放進 request.state
        request.state.session = session
        request.state.session_id = session_id

        response = await call_next(request)

        # 更新 session 儲存
        SESSION_STORE[session_id] = request.state.session

        # 設定 Cookie
        response.set_cookie(self.session_cookie, session_id, httponly=True)

        return response

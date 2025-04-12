import uuid
import json
import redis.asyncio as redis
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from main import redis_url

class RedisSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_url: str = redis_url, session_cookie: str = "session_id"):
        super().__init__(app)
        self.redis = redis.from_url(redis_url)
        self.session_cookie = session_cookie

    async def dispatch(self, request: Request, call_next):
        session_id = request.cookies.get(self.session_cookie)

        if not session_id:
            session_id = str(uuid.uuid4())

        # 讀取 session 資料
        raw = await self.redis.get(session_id)
        session = json.loads(raw) if raw else {}

        # 放進 request.state
        request.state.session = session
        request.state.session_id = session_id

        response = await call_next(request)

        # 儲存回 Redis
        await self.redis.set(session_id, json.dumps(request.state.session), ex=3600)

        # 設定 Cookie
        response.set_cookie(self.session_cookie, session_id, httponly=True)

        return response

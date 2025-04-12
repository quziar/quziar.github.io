from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from itsdangerous import URLSafeSerializer
import os

SECRET_KEY = os.urandom(24).hex()

serializer = URLSafeSerializer(SECRET_KEY, salt="cookie-session")

class CookieSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        cookie = request.cookies.get("session", "")
        try:
            session = serializer.loads(cookie) if cookie else {}
        except Exception:
            session = {}

        request.state.session = session

        response = await call_next(request)

        try:
            encoded = serializer.dumps(request.state.session)
            response.set_cookie(
                key="session",
                value=encoded,
                httponly=True,
                secure=True,
                samesite="None",    # ✅ 跨網域支援
                max_age=3600         # ✅ 1 小時自動過期（可調）
            )
        except Exception as e:
            print("Failed to set cookie:", e)

        return response

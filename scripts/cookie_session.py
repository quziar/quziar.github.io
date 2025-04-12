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
            response.set_cookie("session", encoded, httponly=True, samesite="lax")
        except Exception:
            pass

        return response

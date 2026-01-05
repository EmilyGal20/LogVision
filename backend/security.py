# security.py
import os
import jwt
from datetime import datetime, timedelta, timezone
from jwt import ExpiredSignatureError, InvalidTokenError

SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_FALLBACK")
ALGORITHM = "HS256"

USER_EXP_MINUTES = 60
ADMIN_EXP_HOURS = 24

# כמה "חסד" לתת לסטיית שעון בין שרת/לקוח (בשניות)
LEEWAY_SECONDS = 120  # 2 דקות


def create_token(data: dict) -> str:
    """
    Create a signed JWT token.
    Uses UTC-aware datetime, includes iat + exp.
    Admin gets longer expiration.
    """
    to_encode = data.copy()

    now = datetime.now(timezone.utc)

    if to_encode.get("role") == "admin":
        expire = now + timedelta(hours=ADMIN_EXP_HOURS)
    else:
        expire = now + timedelta(minutes=USER_EXP_MINUTES)

    # ✅ PyJWT יודע לעבוד מעולה עם datetime aware
    to_encode["iat"] = now
    to_encode["exp"] = expire

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    """
    Decode + verify JWT.
    Returns payload dict or {"_error": "..."}.
    """
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            leeway=LEEWAY_SECONDS,
            options={"require": ["exp"]},
        )
        return payload

    except ExpiredSignatureError:
        return {"_error": "expired"}

    except InvalidTokenError:
        return {"_error": "invalid"}

    except Exception:
        # DecodeError / InvalidSignature / וכו'
        return {"_error": "invalid"}

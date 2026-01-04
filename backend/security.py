# import os
# import jwt
# from datetime import datetime, timedelta
# from jwt import ExpiredSignatureError, InvalidTokenError

# SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_FALLBACK")
# ALGORITHM = "HS256"

# USER_EXP_MINUTES = 60
# ADMIN_EXP_HOURS = 24


# def create_token(data: dict):
#     """
#     Create a signed JWT token.
#     Admin gets longer expiration.
#     """
#     to_encode = data.copy()

#     if data.get("role") == "admin":
#         expire = datetime.utcnow() + timedelta(hours=ADMIN_EXP_HOURS)
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=USER_EXP_MINUTES)

#     # ✅ תיקון: exp חייב להיות timestamp מספרי
#     # to_encode["exp"] = int(expire.timestamp())
#     to_encode["exp"] = expire

#     token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return token


# # def verify_token(token: str):
# #     """
# #     Decode + verify JWT.
# #     Return payload or None.
# #     """
# #     try:
# #         decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
# #         return decoded

# #     except ExpiredSignatureError:
# #         print("❌ Token expired")
# #         return None

# #     except InvalidTokenError:
# #         print("❌ Invalid token")
# #         return None

# #     except Exception as e:
# #         print("❌ Unexpected token error:", str(e))
# #         return None

# def verify_token(token: str):
#     try:
#         decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         return decoded

#     except ExpiredSignatureError:
#         return {"_error": "expired"}

#     except InvalidTokenError:
#         return {"_error": "invalid"}

# security.py
import os
import jwt
from datetime import datetime, timedelta
from jwt import ExpiredSignatureError, InvalidTokenError

SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_FALLBACK")
ALGORITHM = "HS256"

USER_EXP_MINUTES = 60
ADMIN_EXP_HOURS = 24


def create_token(data: dict):
    to_encode = data.copy()

    if data.get("role") == "admin":
        expire = datetime.utcnow() + timedelta(hours=ADMIN_EXP_HOURS)
    else:
        expire = datetime.utcnow() + timedelta(minutes=USER_EXP_MINUTES)

    # ✅ הכי בטוח: timestamp מספרי
    to_encode["exp"] = int(expire.timestamp())

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    except ExpiredSignatureError:
        return {"_error": "expired"}

    except InvalidTokenError:
        return {"_error": "invalid"}

    except Exception:
        # ✅ PyJWT לפעמים זורק חריגות אחרות (DecodeError/InvalidSignature וכו')
        return {"_error": "invalid"}

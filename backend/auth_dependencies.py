# from fastapi import Depends, HTTPException
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from security import verify_token
# # from jose import jwt, JWTError, ExpiredSignatureError

# # SECRET_KEY = "..."
# # ALGORITHM = "HS256"


# # def verify_token(token: str):
# #     try:
# #         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
# #         return payload
# #     except ExpiredSignatureError:
# #         return {"_error": "expired"}
# #     except JWTError:
# #         return None


# security = HTTPBearer()


# # ============================================================
# # Extract + Validate token → return decoded payload
# # ============================================================
# # def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
# #     """
# #     Reads the JWT token from the Authorization header.
# #     Verifies it.
# #     Returns the decoded payload.
# #     """

# #     if token is None or token.credentials is None:
# #         raise HTTPException(
# #             status_code=401, detail="Missing authentication token")

# #     payload = verify_token(token.credentials)

# #     if payload is None:
# #         raise HTTPException(status_code=401, detail="Invalid token")

# #     if payload.get("_error") == "expired":
# #         raise HTTPException(status_code=401, detail="Token expired")

# #     return payload
# def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
#     if token is None or token.credentials is None:
#         raise HTTPException(
#             status_code=401, detail="Missing authentication token")

#     payload = verify_token(token.credentials)

#     if payload.get("_error") == "expired":
#         raise HTTPException(status_code=401, detail="Token expired")

#     if payload.get("_error") == "invalid":
#         raise HTTPException(status_code=401, detail="Invalid token")

#     return payload


# def require_admin(user=Depends(get_current_user)):
#     if user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Admins only")
#     return user


# def require_user(user=Depends(get_current_user)):
#     if not user:
#         raise HTTPException(status_code=401, detail="Authentication required")
#     return user
# # ============================================================
# # REQUIRE ADMIN ACCESS
# # ============================================================


# def require_admin(user=Depends(get_current_user)):
#     """
#     Allows only users with role=admin to access the route.
#     """

#     if user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Admins only")

#     return user


# # ============================================================
# # REQUIRE LOGGED-IN USER
# # ============================================================
# def require_user(user=Depends(get_current_user)):
#     """
#     Requires any authenticated user (user/admin).
#     Useful for endpoints like: /profile, /logs/create, etc.
#     """

#     if not user:
#         raise HTTPException(status_code=401, detail="Authentication required")

#     return user

#  --------------------------------------------------------------------------------------------

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from security import verify_token

security = HTTPBearer()


def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    print("AUTH HEADER CREDENTIALS:",
          token.credentials[:20] if token else None)

    if token is None or token.credentials is None:
        raise HTTPException(
            status_code=401, detail="Missing authentication token")

    payload = verify_token(token.credentials)
    print("VERIFY PAYLOAD:", payload)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("_error") == "expired":
        raise HTTPException(status_code=401, detail="Token expired")

    if payload.get("_error") == "invalid":
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return user


def require_user(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

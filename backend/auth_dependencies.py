from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from security import verify_token

security = HTTPBearer()


# ============================================================
# Extract + Validate token → return decoded payload
# ============================================================
def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    """
    Reads the JWT token from the Authorization header.
    Verifies it.
    Returns the decoded payload.
    """

    if token is None or token.credentials is None:
        raise HTTPException(
            status_code=401, detail="Missing authentication token")

    payload = verify_token(token.credentials)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload


# ============================================================
# REQUIRE ADMIN ACCESS
# ============================================================
def require_admin(user=Depends(get_current_user)):
    """
    Allows only users with role=admin to access the route.
    """

    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    return user


# ============================================================
# REQUIRE LOGGED-IN USER
# ============================================================
def require_user(user=Depends(get_current_user)):
    """
    Requires any authenticated user (user/admin).
    Useful for endpoints like: /profile, /logs/create, etc.
    """

    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    return user

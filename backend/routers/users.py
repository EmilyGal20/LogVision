from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from schemas import UserCreate, UserUpdate
from auth_dependencies import require_admin, require_super_admin
import bcrypt

router = APIRouter(prefix="/users", tags=["Users"])

# ------------------------
#  DB Session
# ------------------------


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
#   GET ALL USERS  (admin only)
# ============================================================
@router.get("/", dependencies=[Depends(require_admin)])   # ←← HERE (no /)
def get_users(search: str = None, org_id: int = None, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(User)

    if user.role != "super_admin":
        query = query.filter(User.org_id == user.org_id)
    elif org_id:
        query = query.filter(User.org_id == org_id)

    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )

    return query.all()


# ============================================================
#   CREATE USER (admin only)
# ============================================================
@router.post("/", dependencies=[Depends(require_admin)])   # ← no /
def create_user(user: UserCreate, db: Session = Depends(get_db), current=Depends(require_admin)):
    exists = db.query(User).filter(User.username == user.username).first()
    if exists:
        raise HTTPException(400, "Username already taken")

    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()

    org_id = current.org_id
    if current.role == "super_admin" and user.org_id:
        org_id = user.org_id

    new_user = User(
        username=user.username,
        password=hashed,
        full_name=user.full_name,
        email=user.email,
        role=user.role if user.role else "user",
        org_id=org_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ============================================================
#   UPDATE USER
# ============================================================
@router.put("/{user_id}", dependencies=[Depends(require_admin)])
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(404, "User not found")

    if current.role != "super_admin" and user.org_id != current.org_id:
        raise HTTPException(403, "Cross-org update forbidden")

    if user.id == 1 and data.role and data.role != "admin":
        raise HTTPException(403, "Cannot change role of main admin")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.email is not None:
        user.email = data.email
    if data.role is not None:
        user.role = data.role

    db.commit()
    db.refresh(user)

    return user


# ============================================================
#   DELETE USER
# ============================================================
@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db), current=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(404, "User not found")

    if current.role != "super_admin" and user.org_id != current.org_id:
        raise HTTPException(403, "Cross-org delete forbidden")

    if user.id == 1:
        raise HTTPException(403, "Cannot delete main admin account")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}

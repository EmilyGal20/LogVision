from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from schemas import UserCreate, LoginSchema, UserOut
import bcrypt
from passlib.context import CryptContext

from security import create_token
from auth_dependencies import require_admin

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def ensure_admin_exists():
    db = SessionLocal()

    admin = db.query(User).filter(User.role == "admin").first()
    if admin:
        print("Admin already exists")
        db.close()
        return

    admin_user = User(
        username="Admin",
        password=hash_password("admin123"),
        email="admin@example.com",
        full_name="System Admin",
        role="admin"
    )

    db.add(admin_user)
    db.commit()
    db.close()

    print("Admin created")

# ============================================================
# DB SESSION
# ============================================================


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# TEST ADMIN ROUTE
# ============================================================
@router.get("/", dependencies=[Depends(require_admin)])
def test_admin():
    return {"message": "Admin access confirmed"}


# ============================================================
# REGISTER USER
# ============================================================
@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(400, "Username already taken")

    if user.email:
        if db.query(User).filter(User.email == user.email).first():
            raise HTTPException(400, "Email already registered")

    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()

    new_user = User(
        username=user.username,
        password=hashed,
        full_name=user.full_name,
        email=user.email,
        role="user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ============================================================
# LOGIN
# ============================================================
@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    print("LOGIN DATA:", data)

    # 🔍 sherch by Username or Email
    user = (
        db.query(User)
        .filter(
            (User.username == data.username) |
            (User.email == data.username)
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if not bcrypt.checkpw(
        data.password.encode(),
        user.password.encode()
    ):
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = create_token({
        "id": user.id,
        "username": user.username,
        "role": user.role
    })

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }

# ============================================================
# UPDATE ROLE (ADMIN ONLY)
# ============================================================


@router.put("/role/{user_id}", dependencies=[Depends(require_admin)])
def update_role(user_id: int, data: dict, db: Session = Depends(get_db)):
    new_role = data.get("role")

    if new_role not in ["admin", "user"]:
        raise HTTPException(400, "Invalid role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.role = new_role
    db.commit()
    db.refresh(user)

    return {"message": "Role updated", "user": user}


# ============================================================
# CREATE FIRST ADMIN (SAFE)
# ============================================================
@router.get("/create-admin")
def create_admin(db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.role == "admin").first()
    if existing:
        return {"message": "Admin already exists", "admin": existing}

    hashed = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()

    admin = User(
        username="Admin",
        password=hashed,
        full_name="System Admin",
        email="admin@example.com",
        role="admin"
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {"message": "Admin created successfully", "admin": admin}


@router.on_event("startup")
def seed_admin():
    ensure_admin_exists()

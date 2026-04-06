from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Organization
from schemas import UserCreate, LoginSchema, UserOut
import bcrypt
from passlib.context import CryptContext

from security import create_token
from auth_dependencies import require_admin
from auth_dependencies import require_user


router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def ensure_admin_exists():
    db = SessionLocal()

    admin = db.query(User).filter(User.role.in_(["admin", "super_admin"])).first()
    if admin:
        print("Admin already exists")
        db.close()
        return

    org = db.query(Organization).filter(Organization.id == 1).first()
    if not org:
        org = Organization(id=1, name="Default Org")
        db.add(org)
        db.commit()
        db.refresh(org)

    admin_user = User(
        username="Admin",
        password=hash_password("admin123"),
        email="admin@example.com",
        full_name="System Admin",
        role="super_admin",
        org_id=org.id
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


@router.get("/me", dependencies=[Depends(require_user)])
def me(user=Depends(require_user)):
    return user

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

    org_id = None
    if user.org_id:
        org_id = user.org_id
    elif user.org_name:
        existing = db.query(Organization).filter(Organization.name == user.org_name).first()
        if not existing:
            existing = Organization(name=user.org_name)
            db.add(existing)
            db.commit()
            db.refresh(existing)
        org_id = existing.id
    else:
        org_id = 1

    role = user.role if user.role else "user"
    if user.org_name:
        role = "org_admin"

    new_user = User(
        username=user.username,
        password=hashed,
        full_name=user.full_name,
        email=user.email,
        role=role,
        org_id=org_id
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
    # print("LOGIN DATA:", data)
    # print(f"LOGIN attempt for user: {data.username}")

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
        "role": user.role,
        "org_id": user.org_id,
    })

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "org_id": user.org_id,
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
        role="super_admin",
        org_id=1
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {"message": "Admin created successfully", "admin": admin}


@router.on_event("startup")
def seed_admin():
    ensure_admin_exists()

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Organization
from schemas import OrganizationCreate, OrganizationOut
from auth_dependencies import require_user, require_super_admin

router = APIRouter(prefix="/orgs", tags=["Organizations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[OrganizationOut], dependencies=[Depends(require_super_admin)])
def list_orgs(db: Session = Depends(get_db)):
    return db.query(Organization).order_by(Organization.name.asc()).all()


@router.get("/me", response_model=OrganizationOut)
def get_my_org(db: Session = Depends(get_db), user=Depends(require_user)):
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if not org:
        raise HTTPException(404, "Organization not found")
    return org


@router.post("/", response_model=OrganizationOut, dependencies=[Depends(require_super_admin)])
def create_org(payload: OrganizationCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(400, "Organization name required")

    existing = db.query(Organization).filter(Organization.name == name).first()
    if existing:
        raise HTTPException(400, "Organization already exists")

    org = Organization(name=name)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

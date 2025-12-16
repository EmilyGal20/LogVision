from fastapi import APIRouter, Depends, HTTPException
import json
from pathlib import Path
from auth_dependencies import require_admin
import uuid

router = APIRouter(prefix="/hardware", tags=["Hardware Errors"])

DB_FILE = Path("hardware_errors.json")


# ==========================================================
# HELPERS
# ==========================================================
def load_db():
    """Load hardware errors JSON file"""
    if not DB_FILE.exists():
        return []
    try:
        with open(DB_FILE, "r", encoding="utf8") as f:
            return json.load(f)
    except:
        return []


def save_db(data):
    """Save hardware errors JSON file"""
    with open(DB_FILE, "w", encoding="utf8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ==========================================================
# GET ALL HARDWARE ERRORS (with ID fix + source flag)
# ==========================================================
@router.get("/errors")
def get_all_errors():
    db = load_db()
    fixed = []

    for item in db:
        new_item = item.copy()

        # ✨ שמירת ID המקורי
        original_id = new_item.get("id")

        # ✨ הוספת מקור
        new_item["source"] = "json"

        # ✨ אם ה־ID מתנגש (לוגים אמיתיים גם משתמשים במספרים) → לייצר ID חדש
        if isinstance(original_id, int):
            # מזהה בטוח
            new_item["id"] = f"json-{original_id}"

        fixed.append(new_item)

    return fixed


# ==========================================================
# GET ERRORS BY IP
# ==========================================================
@router.get("/by-ip/{ip}")
def get_errors_by_ip(ip: str):
    db = load_db()
    result = [item for item in db if item.get("ip") == ip]

    # הוספת "source" גם כאן
    for item in result:
        item["source"] = "json"
        if isinstance(item["id"], int):
            item["id"] = f"json-{item['id']}"

    return {
        "ip": ip,
        "count": len(result),
        "errors": result
    }


# ==========================================================
# ADD NEW ERROR (POST)
# ==========================================================
@router.post("/errors")
def add_error(error: dict):
    db = load_db()

    # מייצרים ID ייחודי
    new_id = f"json-{uuid.uuid4().hex[:8]}"

    error["id"] = new_id
    error["source"] = "json"

    db.append(error)
    save_db(db)

    return {"ok": True, "created": error}


# ==========================================================
# UPDATE ERROR
# ==========================================================
@router.put("/errors/{error_id}")
def update_error(error_id: str, data: dict):
    db = load_db()

    for item in db:
        if str(item.get("id")) == error_id or f"json-{item.get('id')}" == error_id:
            item.update(data)
            save_db(db)
            return {"ok": True, "updated": item}

    raise HTTPException(404, "Error not found")


# ==========================================================
# DELETE ERROR
# ==========================================================
@router.delete("/errors/{error_id}")
def delete_error(error_id: str):
    db = load_db()
    new_db = []

    deleted = None

    for item in db:
        if str(item.get("id")) == error_id or f"json-{item.get('id')}" == error_id:
            deleted = item
            continue
        new_db.append(item)

    if not deleted:
        raise HTTPException(404, "Error not found")

    save_db(new_db)

    return {"ok": True, "deleted": deleted}

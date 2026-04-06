import os
import json
import urllib.request
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import SessionLocal
from models import Log, Device, Alert
from auth_dependencies import require_user

router = APIRouter(prefix="/ai", tags=["AI"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _org_scope(user, org_id: Optional[int]) -> int:
    if user.role == "super_admin" and org_id:
        return org_id
    return user.org_id


def _call_openai(payload: dict) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("missing_api_key")

    url = "https://api.openai.com/v1/responses"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _extract_output_text(resp: dict) -> str | None:
    if isinstance(resp, dict):
        if isinstance(resp.get("output_text"), str):
            return resp.get("output_text")
        output = resp.get("output") or []
        for item in output:
            if isinstance(item, dict) and item.get("type") == "message":
                for part in item.get("content", []):
                    if isinstance(part, dict) and isinstance(part.get("text"), str):
                        return part.get("text")
    return None


def _heuristic_summary(logs, alerts, devices):
    critical = sum(1 for l in logs if str(l.severity).lower() == "critical")
    open_logs = sum(1 for l in logs if str(l.status).lower() != "resolved")
    offline = sum(1 for d in devices if d.online is False)
    high_temp = sum(1 for d in devices if (d.cpu_temp or 0) >= 85 or (d.gpu_temp or 0) >= 80)
    risks = []
    if critical:
        risks.append(f"{critical} critical incidents in recent logs.")
    if offline:
        risks.append(f"{offline} devices currently offline.")
    if high_temp:
        risks.append(f"{high_temp} devices show thermal stress.")
    if not risks:
        risks.append("No high-severity or offline signals detected.")

    recs = []
    if critical:
        recs.append("Investigate top critical incidents and verify affected IPs.")
    if offline:
        recs.append("Check offline devices in hardware diagnostics and uptime history.")
    if high_temp:
        recs.append("Review thermal telemetry; consider cooling or workload checks.")
    if not recs:
        recs.append("Continue monitoring; no urgent actions required.")

    roots = []
    if critical and offline:
        roots.append("Possible connectivity instability causing repeated critical incidents.")
    if high_temp:
        roots.append("Possible hardware thermal degradation or overload.")
    if not roots:
        roots.append("No dominant root-cause pattern detected.")

    evidence = [
        f"Open incidents: {open_logs}",
        f"Alerts in queue: {len(alerts)}",
        f"Devices online: {len(devices) - offline}/{len(devices)}",
    ]

    return {
        "summary": f"{open_logs} open incidents; {len(alerts)} alerts; {offline} devices offline.",
        "risks": risks,
        "recommendations": recs,
        "root_causes": roots,
        "evidence": evidence,
        "source": "heuristic",
    }


@router.post("/summary/org")
def ai_org_summary(
    limit: int = 50,
    org_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(require_user),
):
    target_org = _org_scope(user, org_id)

    logs = (
        db.query(Log)
        .filter(Log.org_id == target_org)
        .order_by(Log.created_at.desc())
        .limit(limit)
        .all()
    )
    alerts = (
        db.query(Alert)
        .filter(Alert.org_id == target_org)
        .order_by(Alert.created_at.desc())
        .limit(50)
        .all()
    )
    devices = db.query(Device).filter(Device.org_id == target_org).all()

    heuristic = _heuristic_summary(logs, alerts, devices)

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    prompt = {
        "org_id": target_org,
        "recent_logs": [
            {
                "ip": l.ip,
                "severity": l.severity,
                "status": l.status,
                "type": l.error_type,
                "created_at": l.created_at.isoformat() if l.created_at else None,
                "description": (l.description or "")[:160],
            }
            for l in logs[:50]
        ],
        "alerts": [
            {
                "severity": a.severity,
                "type": a.type,
                "device_ip": a.device_ip,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "message": (a.message or "")[:160],
            }
            for a in alerts[:30]
        ],
        "devices": [
            {
                "ip": d.ip,
                "online": d.online,
                "cpu_temp": d.cpu_temp,
                "gpu_temp": d.gpu_temp,
                "ram_used": d.ram_used,
            }
            for d in devices[:60]
        ],
    }

    payload = {
        "model": model,
        "input": [
            {
                "role": "system",
                "content": (
                    "You are an operations analyst. Return JSON only with keys: "
                    "summary (string), risks (array of strings), recommendations (array), "
                    "root_causes (array), evidence (array). Keep concise and explainable."
                ),
            },
            {
                "role": "user",
                "content": f"Analyze this org telemetry JSON: {json.dumps(prompt)}",
            },
        ],
    }

    try:
        resp = _call_openai(payload)
        text = _extract_output_text(resp)
        if not text:
            return heuristic
        try:
            parsed = json.loads(text)
            parsed["source"] = "openai"
            return parsed
        except Exception:
            return {**heuristic, "summary": text, "source": "openai"}
    except Exception:
        return heuristic

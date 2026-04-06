from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, List, Any


# ============================================================
# USERS SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    org_id: Optional[int] = None
    org_name: Optional[str] = None
    role: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str
    org_id: Optional[int] = None

    # class Config:
    #     orm_mode = True
    class Config:
        from_attributes = True


class UserBasic(BaseModel):
    id: int
    username: str
    role: str
    org_id: Optional[int] = None

    class Config:
        from_attributes = True


class LoginSchema(BaseModel):
    username: str
    password: str


# ============================================================
# LOGS SCHEMAS
# ============================================================

class LogCreate(BaseModel):
    computer_name: str
    ip: str
    error_type: str
    description: str
    severity: str = "Low"


class LogOut(BaseModel):
    id: str | int
    computer_name: str
    ip: str
    error_type: str
    description: str
    severity: str
    status: str
    created_at: datetime
    org_id: Optional[int] = None

    class Config:
        from_attributes = True


class LogRead(BaseModel):
    id: str | int
    computer_name: str
    ip: str
    error_type: str
    description: str
    severity: str
    status: str
    created_at: datetime
    created_by: Optional[int] = None
    org_id: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================================
# DEVICES SCHEMAS
# ============================================================

class DeviceCreate(BaseModel):
    ip: str
    hostname: Optional[str] = None
    disk_health: Optional[Dict] = {}


class DeviceUpdate(BaseModel):
    hostname: Optional[str] = None
    online: Optional[bool] = None
    cpu_temp: Optional[float] = None
    gpu_temp: Optional[float] = None
    ram_used: Optional[float] = None
    disk_health: Optional[Dict] = None


class DeviceOut(BaseModel):
    id: int
    ip: str
    hostname: Optional[str]
    online: bool
    cpu_temp: Optional[float]
    gpu_temp: Optional[float]
    ram_used: Optional[float]
    disk_health: Optional[Dict]
    last_ping: Optional[datetime]
    last_update: Optional[datetime]
    org_id: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================================
# ALERTS SCHEMAS (NEW — matching the upgraded model)
# ============================================================

class AlertCreate(BaseModel):
    type: str
    message: str
    severity: str  # info / warning / critical (או מה שאת משתמשת בפועל)
    device_ip: Optional[str] = None


class AlertOut(BaseModel):
    id: int
    type: str
    message: str
    severity: str
    device_ip: Optional[str] = None
    created_at: datetime
    acknowledged: bool
    org_id: Optional[int] = None

    class Config:
        from_attributes = True

# ============================================================
# SETTINGS SCHEMAS (Final Clean Version)
# ============================================================


class SettingUpdate(BaseModel):
    key: str
    value: Any              # dict / bool / int / str


class SettingOut(BaseModel):
    key: str
    value: Any

    class Config:
        from_attributes = True

# ============================================================
# MONITORING SCHEMAS
# ============================================================


class MonitorEvent(BaseModel):
    ip: str
    online: bool
    latency: float
    jitter: float
    packet_loss: float
    timestamp: datetime
    org_id: Optional[int] = None


class UptimeOut(BaseModel):
    ip: str
    uptime_percent: float
    timestamp: datetime
    org_id: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================================
# ORGANIZATION SCHEMAS
# ============================================================


class OrganizationCreate(BaseModel):
    name: str


class OrganizationOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# NOTIFICATION SCHEMAS
# ============================================================


class NotificationOut(BaseModel):
    id: int
    org_id: int
    user_id: Optional[int] = None
    type: str
    message: str
    created_at: datetime
    read: bool

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    type: str = "info"
    message: str
    user_id: Optional[int] = None
    org_id: Optional[int] = None


# ============================================================
# TASK ASSIGNMENTS
# ============================================================


class TaskAssignCreate(BaseModel):
    log_id: int
    assignee_type: str  # user | org | none
    assignee_value: Optional[str] = None  # username or org_id


class TaskOut(BaseModel):
    id: int
    log_id: int
    org_id: int
    assigned_type: Optional[str] = None
    assigned_user: Optional[str] = None
    assigned_org: Optional[int] = None
    assigned_value: Optional[str] = None
    status: str
    severity: str
    sla_hours: int
    due_at: Optional[datetime] = None
    sla_status: Optional[str] = None
    last_reminder_at: Optional[datetime] = None
    sla_status: Optional[str] = None
    last_reminder_at: Optional[datetime] = None

    class Config:
        from_attributes = True

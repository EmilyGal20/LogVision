from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, List, Any


# ============================================================
# USERS SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str

    class Config:
        orm_mode = True


class UserBasic(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        orm_mode = True


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

    class Config:
        orm_mode = True


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

    class Config:
        orm_mode = True


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

    class Config:
        orm_mode = True


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

    class Config:
        orm_mode = True

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
        orm_mode = True


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


class UptimeOut(BaseModel):
    ip: str
    uptime_percent: float
    timestamp: datetime

    class Config:
        orm_mode = True

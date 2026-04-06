from sqlalchemy import (
    Column, String, Integer, DateTime, Text, Boolean, Float, ForeignKey, JSON
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


# ============================================================
# ORGANIZATIONS TABLE
# ============================================================
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization", lazy="selectin")


# ============================================================
# USERS TABLE
# ============================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    full_name = Column(String)
    email = Column(String, unique=True)
    role = Column(String, default="user")  # viewer / operator / org_admin / admin / super_admin
    org_id = Column(Integer, ForeignKey("organizations.id"), default=1)

    # Relationship: logs created by user
    logs = relationship("Log", back_populates="creator", lazy="selectin")
    organization = relationship("Organization", back_populates="users")


# ============================================================
# LOGS TABLE (Hardware / Software / Network)
# ============================================================
class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    computer_name = Column(String)
    ip = Column(String, index=True)
    error_type = Column(String)            # Hardware / Software / Network
    description = Column(Text)
    severity = Column(String, default="Low")   # Low / Medium / Critical
    status = Column(String, default="open")     # open / resolved / ignored
    org_id = Column(Integer, ForeignKey("organizations.id"), default=1)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    created_by = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", back_populates="logs")


# ============================================================
# DEVICES TABLE
# ============================================================
class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, unique=True, index=True)
    hostname = Column(String, nullable=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), default=1)

    # System Health
    online = Column(Boolean, default=False)
    cpu_temp = Column(Float, default=0)
    gpu_temp = Column(Float, default=0)
    ram_used = Column(Float, default=0)
    disk_health = Column(JSON, default={})

    # Monitoring Metadata
    last_ping = Column(DateTime, nullable=True)
    last_update = Column(
        DateTime, server_default=func.now(), onupdate=func.now())


# ============================================================
# ALERTS TABLE (Real notification system)
# ============================================================
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    # cpu_overheat / device_down / login_fail / custom
    type = Column(String)
    message = Column(Text)
    severity = Column(String, default="info")   # info / warning / critical

    device_ip = Column(String, nullable=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    acknowledged = Column(Boolean, default=False)  # Admin marked as seen
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)


# ============================================================
# NOTIFICATIONS TABLE
# ============================================================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), default=1)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    type = Column(String, default="info")
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    read = Column(Boolean, default=False)


# ============================================================
# SYSTEM SETTINGS TABLE (Theme, Flags, API Keys)
# ============================================================
class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)

    key = Column(String, unique=True)
    value = Column(String)  # theme = "dark", api_key, json configs

    updated_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
# MONITOR HISTORY TABLE (Realtime monitor)
# ============================================================
class MonitorHistory(Base):
    __tablename__ = "monitor_history"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), default=1)
    online = Column(Boolean)
    latency = Column(Float, default=0)
    packet_loss = Column(Float, default=0)
    jitter = Column(Float, default=0)

    timestamp = Column(DateTime, default=datetime.utcnow)


# ============================================================
# UPTIME HISTORY TABLE
# ============================================================
class UptimeHistory(Base):
    __tablename__ = "uptime_history"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), default=1)
    uptime_percent = Column(Float, default=0)

    timestamp = Column(DateTime, default=datetime.utcnow)

# ----------------------------
# System Settings Table
# ----------------------------


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    # e.g. "theme", "permissions.allow_delete_logs"
    key = Column(String, unique=True, index=True)
    value = Column(Text)  # JSON string

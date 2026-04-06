import sqlite3
from database import DB_PATH


def _column_exists(cur, table, column):
    cur.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())


def _table_exists(cur, table):
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cur.fetchone() is not None


def ensure_org_schema():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # organizations table
    if not _table_exists(cur, "organizations"):
        cur.execute(
            "CREATE TABLE organizations (id INTEGER PRIMARY KEY, name TEXT UNIQUE, created_at DATETIME)"
        )

    # default org
    cur.execute("SELECT id FROM organizations WHERE id=1")
    if cur.fetchone() is None:
        cur.execute("INSERT INTO organizations (id, name, created_at) VALUES (1, 'Default Org', datetime('now'))")

    # add org_id columns
    targets = [
        "users",
        "logs",
        "devices",
        "alerts",
        "monitor_history",
        "uptime_history",
        "notifications",
    ]

    # incident tasks table
    if not _table_exists(cur, "incident_tasks"):
        cur.execute(
            "CREATE TABLE incident_tasks ("
            "id INTEGER PRIMARY KEY, "
            "log_id INTEGER, "
            "org_id INTEGER DEFAULT 1, "
            "assigned_user_id INTEGER, "
            "assigned_org_id INTEGER, "
            "status TEXT, "
            "severity TEXT, "
            "sla_hours INTEGER, "
            "due_at DATETIME, "
            "last_reminder_at DATETIME, "
            "created_at DATETIME, "
            "updated_at DATETIME"
            ")"
        )

    for table in targets:
        if _table_exists(cur, table) and not _column_exists(cur, table, "org_id"):
            cur.execute(f"ALTER TABLE {table} ADD COLUMN org_id INTEGER DEFAULT 1")

    # backfill org_id
    for table in targets:
        if _table_exists(cur, table):
            cur.execute(f"UPDATE {table} SET org_id = 1 WHERE org_id IS NULL")

    conn.commit()
    conn.close()

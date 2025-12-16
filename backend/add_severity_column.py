import sqlite3

db = "logs.db"

print("Connecting to logs.db...")
conn = sqlite3.connect(db)
cursor = conn.cursor()

try:
    print("Adding severity column...")
    cursor.execute("ALTER TABLE logs ADD COLUMN severity TEXT DEFAULT 'Low'")
    conn.commit()
    print("DONE! Column added successfully.")

except Exception as e:
    print("ERROR:", e)

finally:
    conn.close()

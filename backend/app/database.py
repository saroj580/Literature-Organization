import os
import json
import sqlite3
import secrets

import sys

def get_data_dir() -> str:
    # If running inside PyInstaller bundle
    if getattr(sys, 'frozen', False):
        base = os.environ.get('APPDATA', os.path.expanduser('~'))
        data_dir = os.path.join(base, 'LiteratureOrganizer')
    else:
        # Development mode
        data_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(data_dir, exist_ok=True)
    return data_dir

DB_PATH = os.path.join(get_data_dir(), "organizer.db")

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def row_to_dict(r: sqlite3.Row) -> dict:
    try:
        created_at = r["created_at"]
    except (IndexError, KeyError):
        created_at = None
    return {"id": r["id"], "data": json.loads(r["data"]), "created_at": created_at}

def init_db():
    conn = get_conn()
    c = conn.cursor()

    # Documents table
    c.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        data       JSON,
        created_at TEXT DEFAULT (datetime('now'))
    )""")
    existing = {row[1] for row in c.execute("PRAGMA table_info(documents)").fetchall()}
    if "created_at" not in existing:
        c.execute("ALTER TABLE documents ADD COLUMN created_at TEXT DEFAULT NULL")

    # Users table — single-user; username always 'admin' or custom setup
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        username        TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL
    )""")

    # Settings table — stores the JWT secret key
    c.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )""")

    # Generate and persist JWT secret on first run
    row = c.execute("SELECT value FROM settings WHERE key = 'jwt_secret'").fetchone()
    if not row:
        secret = secrets.token_hex(32)   # 256-bit random key
        c.execute("INSERT INTO settings (key, value) VALUES ('jwt_secret', ?)", (secret,))

    conn.commit()
    conn.close()

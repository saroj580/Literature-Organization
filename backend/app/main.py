import sys
import os

# Ensure backend root is on sys.path for robust imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
for path in (parent_dir, current_dir):
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router

# Initialize database schema and JWT secret
init_db()

app = FastAPI(
    title="Literature Organizer API",
    version="1.0.0",
    description="Offline-first API for organizing research papers, architecture diagrams, and code snippets."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(documents_router)

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": "Literature Organizer API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
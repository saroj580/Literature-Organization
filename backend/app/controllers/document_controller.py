import json
from typing import Optional, List, Dict, Any
from app.database import get_conn, row_to_dict
from app.schemas import Document

class DocumentController:
    @staticmethod
    def create_document(doc: Document) -> Dict[str, Any]:
        conn = get_conn()
        cursor = conn.cursor()
        json_data = json.dumps(doc.metadata)
        cursor.execute("INSERT INTO documents (data) VALUES (?)", (json_data,))
        doc_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return {"id": doc_id, "message": "Document saved successfully"}

    @staticmethod
    def get_documents(doc_type: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_conn()
        cursor = conn.cursor()
        if doc_type:
            cursor.execute(
                "SELECT id, data, created_at FROM documents WHERE json_extract(data, '$.type') = ? ORDER BY id DESC",
                (doc_type,),
            )
        else:
            cursor.execute("SELECT id, data, created_at FROM documents ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        return [row_to_dict(r) for r in rows]

    @staticmethod
    def get_stats() -> Dict[str, int]:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT json_extract(data, '$.type') AS type, COUNT(*) AS count
            FROM documents GROUP BY type
        """)
        rows = cursor.fetchall()
        conn.close()
        return {r["type"]: r["count"] for r in rows if r["type"] is not None}

    @staticmethod
    def search_documents(q: str) -> List[Dict[str, Any]]:
        conn = get_conn()
        cursor = conn.cursor()
        term = f"%{q}%"
        cursor.execute("""
            SELECT id, data, created_at FROM documents
            WHERE json_extract(data, '$.title')    LIKE ?
               OR json_extract(data, '$.content')  LIKE ?
               OR json_extract(data, '$.author')   LIKE ?
               OR json_extract(data, '$.language') LIKE ?
               OR json_extract(data, '$.tags')     LIKE ?
            ORDER BY id DESC
        """, (term, term, term, term, term))
        rows = cursor.fetchall()
        conn.close()
        return [row_to_dict(r) for r in rows]

    @staticmethod
    def update_document(doc_id: int, doc: Document) -> Dict[str, str]:
        conn = get_conn()
        cursor = conn.cursor()
        json_data = json.dumps(doc.metadata)
        cursor.execute("UPDATE documents SET data = ? WHERE id = ?", (json_data, doc_id))
        conn.commit()
        conn.close()
        return {"message": "Document updated successfully"}

    @staticmethod
    def delete_document(doc_id: int) -> Dict[str, str]:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
        conn.close()
        return {"message": "Document deleted successfully"}

from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.schemas import Document
from app.security import verify_token
from app.controllers.document_controller import DocumentController

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("")
def create_document(doc: Document, _: str = Depends(verify_token)):
    return DocumentController.create_document(doc)

@router.get("")
def get_documents(doc_type: Optional[str] = None, _: str = Depends(verify_token)):
    return DocumentController.get_documents(doc_type)

@router.get("/stats")
def get_stats(_: str = Depends(verify_token)):
    return DocumentController.get_stats()

@router.get("/search")
def search_documents(q: str = Query(..., min_length=1), _: str = Depends(verify_token)):
    return DocumentController.search_documents(q)

@router.put("/{id}")
def update_document(id: int, doc: Document, _: str = Depends(verify_token)):
    return DocumentController.update_document(id, doc)

@router.delete("/{id}")
def delete_document(id: int, _: str = Depends(verify_token)):
    return DocumentController.delete_document(id)

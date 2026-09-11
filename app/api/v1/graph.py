from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.postgres_models import User
from app.schemas.graph import GraphResponse, EntityCreate, RelationshipCreate
from app.services.graph_service import graph_service
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])

@router.get("", response_model=GraphResponse)
def get_knowledge_graph(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = graph_service.get_full_graph(db, limit_nodes=limit)
    return data

@router.get("/connections")
def get_entity_connections(
    entity: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conns = graph_service.find_connected_entities(db, entity)
    return {
        "search_term": entity,
        "total_connections": len(conns),
        "connections": conns
    }

@router.post("/entities")
def create_entity(
    req: EntityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager"]))
):
    ent = graph_service.get_or_create_entity(db, req.entity_name, req.entity_type, req.description)
    db.commit()
    return {
        "entity_id": ent.entity_id,
        "entity_name": ent.entity_name,
        "entity_type": ent.entity_type,
        "description": ent.description
    }

@router.post("/relationships")
def create_relationship(
    req: RelationshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Manager"]))
):
    rel = graph_service.add_relationship(db, req.source_entity_id, req.target_entity_id, req.relation_type, req.weight)
    db.commit()
    return {
        "relationship_id": rel.relationship_id,
        "source_entity_id": rel.source_entity_id,
        "target_entity_id": rel.target_entity_id,
        "relation_type": rel.relation_type,
        "weight": rel.weight
    }

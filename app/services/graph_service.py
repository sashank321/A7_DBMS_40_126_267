from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.postgres_models import KnowledgeEntity, KnowledgeRelationship, EntitySource, Document, User, Department

class GraphService:
    def get_or_create_entity(self, db: Session, name: str, entity_type: str, description: Optional[str] = None) -> KnowledgeEntity:
        name_clean = name.strip()
        type_clean = entity_type.strip().upper()
        entity = db.query(KnowledgeEntity).filter(
            KnowledgeEntity.entity_name == name_clean,
            KnowledgeEntity.entity_type == type_clean
        ).first()

        if not entity:
            entity = KnowledgeEntity(
                entity_name=name_clean,
                entity_type=type_clean,
                description=description or f"Entity {name_clean} of type {type_clean}"
            )
            db.add(entity)
            db.flush()
        return entity

    def add_relationship(
        self,
        db: Session,
        source_id: int,
        target_id: int,
        relation_type: str,
        weight: float = 1.0,
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> KnowledgeRelationship:
        rel_clean = relation_type.strip().upper()
        rel = db.query(KnowledgeRelationship).filter(
            KnowledgeRelationship.source_entity_id == source_id,
            KnowledgeRelationship.target_entity_id == target_id,
            KnowledgeRelationship.relation_type == rel_clean
        ).first()

        if not rel:
            rel = KnowledgeRelationship(
                source_entity_id=source_id,
                target_entity_id=target_id,
                relation_type=rel_clean,
                weight=weight,
                metadata_json=metadata_json or {}
            )
            db.add(rel)
            db.flush()
        return rel

    def link_entity_to_source(self, db: Session, entity_id: int, document_id: int, chunk_id: Optional[int] = None, confidence: float = 1.0):
        src = db.query(EntitySource).filter(
            EntitySource.entity_id == entity_id,
            EntitySource.document_id == document_id,
            EntitySource.chunk_id == chunk_id
        ).first()

        if not src:
            src = EntitySource(
                entity_id=entity_id,
                document_id=document_id,
                chunk_id=chunk_id,
                confidence=confidence
            )
            db.add(src)
            db.flush()
        return src

    def get_full_graph(self, db: Session, limit_nodes: int = 50) -> Dict[str, Any]:
        entities = db.query(KnowledgeEntity).limit(limit_nodes).all()
        entity_ids = {e.entity_id for e in entities}
        
        relationships = db.query(KnowledgeRelationship).filter(
            KnowledgeRelationship.source_entity_id.in_(entity_ids),
            KnowledgeRelationship.target_entity_id.in_(entity_ids)
        ).all()

        nodes = [
            {"id": e.entity_id, "name": e.entity_name, "type": e.entity_type, "description": e.description}
            for e in entities
        ]
        edges = [
            {
                "source": r.source_entity_id,
                "target": r.target_entity_id,
                "relation": r.relation_type,
                "weight": r.weight
            }
            for r in relationships
        ]

        return {
            "nodes": nodes,
            "edges": edges,
            "total_nodes": len(nodes),
            "total_edges": len(edges)
        }

    def find_connected_entities(self, db: Session, entity_name: str) -> List[Dict[str, Any]]:
        entity = db.query(KnowledgeEntity).filter(
            KnowledgeEntity.entity_name.ilike(f"%{entity_name}%")
        ).first()

        if not entity:
            return []

        results = []
        # Outgoing
        for rel in entity.outgoing_relationships:
            results.append({
                "source": entity.entity_name,
                "relation": rel.relation_type,
                "target": rel.target_entity.entity_name,
                "target_type": rel.target_entity.entity_type,
                "direction": "outgoing"
            })
        # Incoming
        for rel in entity.incoming_relationships:
            results.append({
                "source": rel.source_entity.entity_name,
                "source_type": rel.source_entity.entity_type,
                "relation": rel.relation_type,
                "target": entity.entity_name,
                "direction": "incoming"
            })

        return results

graph_service = GraphService()

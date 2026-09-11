from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class EntityCreate(BaseModel):
    entity_name: str
    entity_type: str
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class RelationshipCreate(BaseModel):
    source_entity_id: int
    target_entity_id: int
    relation_type: str
    weight: float = 1.0

class GraphNode(BaseModel):
    id: int
    name: str
    type: str
    description: Optional[str] = None

class GraphEdge(BaseModel):
    source: int
    target: int
    relation: str
    weight: float = 1.0

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int

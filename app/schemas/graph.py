from pydantic import BaseModel, Field, StringConstraints
from typing import Annotated
from typing import Optional, List, Dict, Any

class EntityCreate(BaseModel):
    entity_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    entity_type: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class RelationshipCreate(BaseModel):
    source_entity_id: int = Field(gt=0)
    target_entity_id: int = Field(gt=0)
    relation_type: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    weight: float = Field(default=1.0, ge=0, allow_inf_nan=False)

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

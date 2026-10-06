"""Repair known college demo records without resetting the database."""
import sys
from pathlib import Path
from uuid import uuid4
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.postgres import SessionLocal
from app.models.postgres_models import User, Document, DocumentVersion
from app.services.graph_service import graph_service
from app.services.chunking_service import chunking_service

def repair_demo_data():
    storage = Path(settings.STORAGE_DIR).resolve()
    storage.mkdir(parents=True, exist_ok=True)
    with SessionLocal() as db:
        users_fixed = files_fixed = versions_fixed = 0
        for user in db.query(User).filter(User.user_id.in_(range(1, 9))).all():
            if user.password.startswith('$2a$12$eImiTXuWVxfM37uY4JANjO') and user.email.endswith('@knowledgesphere.ai'):
                user.password = get_password_hash('password123')
                users_fixed += 1
        for document in db.query(Document).all():
            current = Path(document.file_path).resolve()
            chunks = sorted(document.chunks, key=lambda c: c.chunk_number)
            # Materialize existing indexed demo content when its sample file is absent or mislabeled.
            if document.document_id <= 10 and chunks:
                content = None
                if not current.is_relative_to(storage) or not current.is_file():
                    content = '\n\n'.join(c.content for c in chunks)
                elif current.suffix.lower() in {'.pdf', '.docx'}:
                    data = current.read_bytes()
                    if not data.startswith((b'%PDF', b'PK')):
                        try:
                            content = data.decode('utf-8')
                        except UnicodeDecodeError:
                            pass
                if content is not None:
                    repaired = storage / f'demo_{document.document_id}_{uuid4().hex}.txt'
                    repaired.write_text(content, encoding='utf-8')
                    document.file_path = str(repaired)
                    document.file_name = repaired.name
                    files_fixed += 1
            latest = max(document.versions, key=lambda v: v.version_number, default=None)
            if latest is None:
                latest = DocumentVersion(document_id=document.document_id, version_number=1, file_path=document.file_path, uploaded_by=document.uploaded_by)
                db.add(latest)
                db.flush()
                versions_fixed += 1
            elif files_fixed and document.document_id <= 10:
                latest.file_path = document.file_path
            for chunk in chunks:
                if chunk.version_id is None:
                    chunk.version_id = latest.version_id
            document_entity = next((source.entity for source in document.entity_sources if source.entity.entity_type == 'DOCUMENT'), None)
            if document_entity is None:
                document_entity = graph_service.get_or_create_entity(db, f'{document.title} [#{document.document_id}]', 'DOCUMENT', document.description)
            person = graph_service.get_or_create_entity(db, document.uploader.name, 'PERSON')
            department = graph_service.get_or_create_entity(db, document.department.department_name, 'DEPARTMENT')
            for entity in [document_entity, person, department]:
                graph_service.link_entity_to_source(db, entity.entity_id, document.document_id)
            graph_service.add_relationship(db, person.entity_id, document_entity.entity_id, 'OWNS')
            graph_service.add_relationship(db, document_entity.entity_id, department.entity_id, 'BELONGS_TO')
        db.commit()
        indexed = chunking_service.reindex_all_chunks(db)
        print(f'Repaired {users_fixed} placeholder demo credentials, {files_fixed} sample files, {versions_fixed} missing versions; reindexed {indexed} chunks.')

if __name__ == '__main__':
    repair_demo_data()

import os
from pathlib import Path
import uuid
import pytest
from sqlalchemy import text
from app.core.config import settings, Settings
from app.db.postgres import SessionLocal
from app.models.postgres_models import User, Document, DocumentChunk
from app.services.document_service import document_service
from app.services.graph_service import graph_service
from app.services.embedding_service import embedding_service

def files():
    return set(Path(settings.STORAGE_DIR).glob('*'))

def test_failed_graph_creation_rolls_back_index_and_file(db_session, monkeypatch):
    title='Atomic failure '+uuid.uuid4().hex
    before=files()
    def fail(*args, **kwargs): raise RuntimeError('Injected graph failure')
    monkeypatch.setattr(graph_service,'add_relationship',fail)
    with pytest.raises(RuntimeError,match='Injected graph failure'):
        document_service.create_document(db_session,title,'',db_session.get(User,1),3,3,[],file_content='Atomic transaction check content.')
    with SessionLocal() as independent:
        assert independent.query(Document).filter_by(title=title).count()==0
    assert files()==before

def test_failed_version_keeps_existing_content_and_file(client, admin_headers, db_session, monkeypatch):
    original='Original content before a deliberately failed update.'
    uploaded=client.post('/api/v1/documents',data={'title':'Version rollback '+uuid.uuid4().hex[:8],'department_id':3,'category_id':3,'content':original},headers=admin_headers)
    assert uploaded.status_code==201,uploaded.text
    did=uploaded.json()['document_id']
    before=files()
    def fail(*args, **kwargs): raise RuntimeError('Injected embedding failure')
    try:
        with monkeypatch.context() as patch:
            patch.setattr(embedding_service,'get_embedding',fail)
            with pytest.raises(RuntimeError,match='Injected embedding failure'):
                document_service.add_version(db_session,did,db_session.get(User,1),file_content='Replacement that must be rolled back.')
        assert files()==before
        assert client.get(f'/api/v1/documents/{did}',headers=admin_headers).json()['latest_version']==1
        assert client.get(f'/api/v1/documents/{did}/download',headers=admin_headers).text==original
        with SessionLocal() as independent:
            assert original in independent.query(DocumentChunk).filter_by(document_id=did).one().content
    finally:
        client.delete(f'/api/v1/documents/{did}',headers=admin_headers)

@pytest.mark.parametrize('filename,body',[('broken.pdf',b'not a PDF'),('empty.txt',b'   ')])
def test_rejected_files_leave_no_orphans(client,admin_headers,filename,body):
    before=files()
    response=client.post('/api/v1/documents',data={'title':'Rejected file','department_id':3,'category_id':3},files={'file':(filename,body)},headers=admin_headers)
    assert response.status_code==422,response.text
    assert files()==before

@pytest.mark.parametrize('extra',[{'title':'   '},{'title':'A'*201},{'tags':'x'*51}])
def test_invalid_document_metadata_returns_validation_error(client,admin_headers,extra):
    response=client.post('/api/v1/documents',data={'title':'Valid','department_id':3,'category_id':3,'content':'Valid content',**extra},headers=admin_headers)
    assert response.status_code==422,response.text

def test_windows_title_and_long_audit_support_upload_and_version(client,admin_headers):
    title='Design: "Windows" <paths> | overview? '+('a'*90)
    response=client.post('/api/v1/documents',data={'title':title,'department_id':3,'category_id':3,'content':'Windows filename and long audit title content.'},headers=admin_headers)
    assert response.status_code==201,response.text
    did=response.json()['document_id']
    try:
        assert all(c not in response.json()['file_name'] for c in '<>:"/\\|?*')
        updated=client.post(f'/api/v1/documents/{did}/versions',data={'content':'Updated long title audit content.'},headers=admin_headers)
        assert updated.status_code==200,updated.text
        assert updated.json()['version_number']==2
        assert client.get(f'/api/v1/documents/{did}/download',headers=admin_headers).text=='Updated long title audit content.'
    finally:
        client.delete(f'/api/v1/documents/{did}',headers=admin_headers)

def test_default_storage_does_not_depend_on_cwd(monkeypatch,tmp_path):
    monkeypatch.delenv('STORAGE_DIR',raising=False)
    monkeypatch.chdir(tmp_path)
    configured=Settings(JWT_SECRET='x'*32, _env_file=None)
    assert Path(configured.STORAGE_DIR)==Path(__file__).resolve().parents[1]/'storage/documents'

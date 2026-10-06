import io
import os
import uuid
import pytest
from app.core.security import verify_password, get_password_hash
from app.models.postgres_models import User
from app.services.text2sql_service import text2sql_service

@pytest.mark.parametrize('query', [
    'SELECT password FROM users', 'SELECT * FROM users',
    'SELECT * FROM "pg_authid"', 'SELECT pg_sleep(1)',
    'SELECT 1; DELETE FROM documents', 'SELECT * FROM documents, pg_authid',
    'WITH deleted AS (DELETE FROM documents RETURNING *) SELECT * FROM deleted',
    'SELECT (SELECT password FROM users LIMIT 1)',
])
def test_sql_rejects_sensitive_or_mutating_queries(query):
    assert text2sql_service.validate_sql(query)[0] is False

def test_passwords_have_no_plaintext_or_demo_shortcuts():
    assert not verify_password('same-password', 'same-password')
    hashed = get_password_hash('password123')
    assert verify_password('password123', hashed)
    assert not verify_password('admin123', hashed)

def test_health_checks_application_schema(client):
    result = client.get('/api/v1/health').json()
    assert result['status'] == 'OPERATIONAL'
    assert result['components']['postgresql']['public_tables'] >= 15
    assert result['components']['postgresql']['document_embeddings'] >= 10

def test_create_user_hashes_and_authenticates(client, admin_headers, db_session):
    email = f'integration-{uuid.uuid4().hex}@example.test'
    result = client.post('/api/v1/users', json={'name': 'Integration User', 'email': email, 'password': 'SecureTest123!', 'role_id': 3, 'department_id': 1}, headers=admin_headers)
    assert result.status_code == 201, result.text
    try:
        assert client.post('/api/v1/auth/login-json', json={'email': email, 'password': 'SecureTest123!'}).status_code == 200
        assert client.post('/api/v1/auth/login-json', json={'email': email, 'password': 'wrong'}).status_code == 401
    finally:
        user = db_session.get(User, result.json()['user_id'])
        db_session.delete(user)
        db_session.commit()

def test_document_permission_sql_graph_and_review_integration(client, admin_headers, employee_headers):
    title = 'Private Nebula ' + uuid.uuid4().hex[:8]
    response = client.post('/api/v1/documents', data={'title': title, 'description': 'Restricted financial planning', 'department_id': 2, 'category_id': 2, 'content': 'Nebula finance restricted financial planning quarterly costs.'}, headers=admin_headers)
    assert response.status_code == 201, response.text
    doc = response.json()
    doc_id = doc['document_id']
    try:
        query = f'SELECT document_id, title FROM documents WHERE document_id = {doc_id}'
        hidden = client.post('/api/v1/text2sql', json={'natural_query': query}, headers=employee_headers)
        assert hidden.status_code == 200
        assert hidden.json()['results'] == []
        graph = client.get('/api/v1/graph', headers=employee_headers).json()
        assert all(title not in node['name'] for node in graph['nodes'])
        assert client.get(f'/api/v1/documents/{doc_id}/download', headers=employee_headers).status_code == 403
        assert client.post('/api/v1/nosql/reviews', json={'document_id': doc_id, 'rating': 5, 'review_text': 'Denied'}, headers=employee_headers).status_code == 403
        granted = client.put(f'/api/v1/documents/{doc_id}/permissions', json={'user_id': 8, 'can_view': True, 'can_edit': False, 'can_delete': False}, headers=admin_headers)
        assert granted.status_code == 200
        visible = client.post('/api/v1/text2sql', json={'natural_query': query}, headers=employee_headers).json()
        assert visible['results'][0]['document_id'] == doc_id
        assert client.get(f'/api/v1/documents/{doc_id}/download', headers=employee_headers).status_code == 200
        graph = client.get('/api/v1/graph', headers=employee_headers).json()
        assert any(title in node['name'] for node in graph['nodes'])
        assert client.post(f'/api/v1/documents/{doc_id}/versions', data={'content': 'Must not edit'}, headers=employee_headers).status_code == 403
        assert client.delete(f'/api/v1/documents/{doc_id}', headers=employee_headers).status_code == 403
    finally:
        assert client.delete(f'/api/v1/documents/{doc_id}', headers=admin_headers).status_code == 200
        assert not os.path.exists(doc['file_path'])

def test_version_download_search_and_citation_agree(client, admin_headers):
    response = client.post('/api/v1/documents', data={'title': 'Integration version test', 'department_id': 3, 'category_id': 3, 'content': 'Old archival documentation.'}, headers=admin_headers)
    assert response.status_code == 201
    doc_id = response.json()['document_id']
    try:
        content = 'Superconducting qubits require quantum error correction and surface codes to suppress environmental decoherence.'
        version = client.post(f'/api/v1/documents/{doc_id}/versions', data={'content': content}, headers=admin_headers)
        assert version.status_code == 200, version.text
        assert version.json()['version_number'] == 2
        download = client.get(f'/api/v1/documents/{doc_id}/download', headers=admin_headers)
        assert download.text == content
        rag = client.post('/api/v1/rag/query', json={'question': 'Explain superconducting qubit noise suppression using surface codes', 'top_k': 10}, headers=admin_headers)
        assert rag.status_code == 200, rag.text
        citation = next(c for c in rag.json()['citations'] if c['document_id'] == doc_id)
        assert citation['version_number'] == 2
    finally:
        client.delete(f'/api/v1/documents/{doc_id}', headers=admin_headers)

def test_sql_counts_and_structured_rag_respect_employee_access(client, employee_headers):
    docs = client.get('/api/v1/documents', headers=employee_headers).json()
    sql = client.post('/api/v1/text2sql', json={'natural_query': 'SELECT COUNT(*) AS count FROM documents'}, headers=employee_headers).json()
    assert sql['status'] == 'SUCCESS', sql
    assert sql['results'][0]['count'] == len(docs)
    rag = client.post('/api/v1/rag/query', json={'question': 'How many documents are in each department?'}, headers=employee_headers)
    assert rag.status_code == 200
    assert rag.json()['unauthorized_documents_filtered'] > 0

def test_telemetry_contract_matches_live_aggregations(client, admin_headers):
    stats = client.get('/api/v1/nosql/telemetry', headers=admin_headers).json()
    assert sum(stats['action_distribution'].values()) == stats['total_activities']
    assert sum(stats['ratings_distribution'].values()) == stats['total_reviews']
    assert 0 <= stats['average_rating'] <= 5
    assert isinstance(stats['recent_activities'], list)

def test_audit_views_are_real_and_admin_only(client, admin_headers, employee_headers):
    for endpoint in ['analytics', 'access-matrix']:
        response = client.get('/api/v1/audit/' + endpoint, headers=admin_headers)
        assert response.status_code == 200
        assert response.json()['rows']
        assert client.get('/api/v1/audit/' + endpoint, headers=employee_headers).status_code == 403

def test_upload_rejects_empty_content_and_bad_references(client, admin_headers):
    for fields in [{'title': 'Empty', 'department_id': 3, 'category_id': 3}, {'title': 'Bad reference', 'department_id': 99999, 'category_id': 3, 'content': 'content'}]:
        assert client.post('/api/v1/documents', data=fields, headers=admin_headers).status_code == 422

def test_upload_sanitizes_filename_and_extracts_docx(client, admin_headers):
    from docx import Document
    document = Document()
    document.add_paragraph('Actual Word extraction verification content.')
    stream = io.BytesIO()
    document.save(stream)
    result = client.post('/api/v1/documents', data={'title': 'Word integration', 'department_id': 3, 'category_id': 3}, files={'file': ('../../../../unsafe.docx', stream.getvalue(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}, headers=admin_headers)
    assert result.status_code == 201, result.text
    doc = result.json()
    try:
        from app.core.config import settings
        assert os.path.commonpath([settings.STORAGE_DIR, doc['file_path']]) == settings.STORAGE_DIR
        assert client.get(f"/api/v1/documents/{doc['document_id']}/download", headers=admin_headers).content == stream.getvalue()
        assert 'unsafe.docx' in client.get(f"/api/v1/documents/{doc['document_id']}/download", headers=admin_headers).headers['content-disposition']
        version = client.post(f"/api/v1/documents/{doc['document_id']}/versions", data={'content': 'Updated text version'}, headers=admin_headers)
        assert version.status_code == 200
        download = client.get(f"/api/v1/documents/{doc['document_id']}/download", headers=admin_headers)
        assert download.text == 'Updated text version'
        assert '.txt' in download.headers['content-disposition']
    finally:
        client.delete(f"/api/v1/documents/{doc['document_id']}", headers=admin_headers)

def test_review_validation_and_missing_document(client, admin_headers):
    assert client.post('/api/v1/nosql/reviews', json={'document_id': 99999, 'rating': 5, 'review_text': 'Missing'}, headers=admin_headers).status_code == 404
    assert client.post('/api/v1/nosql/reviews', json={'document_id': 1, 'rating': 0, 'review_text': 'Invalid'}, headers=admin_headers).status_code == 422

def test_storage_path_is_anchored_to_project():
    from pathlib import Path
    from app.core.config import Settings
    configured = Settings(STORAGE_DIR='storage/documents')
    assert Path(configured.STORAGE_DIR).is_absolute()
    assert Path(configured.STORAGE_DIR) == Path(__file__).resolve().parents[1] / 'storage/documents'

def test_hybrid_search_keeps_best_chunk_without_duplicate_votes(monkeypatch):
    from app.services.search_service import SearchService
    service = SearchService()
    best = {'document_id': 1, 'chunk_id': 10, 'similarity_score': 0.9}
    duplicate = {'document_id': 1, 'chunk_id': 11, 'similarity_score': 0.5}
    other = {'document_id': 2, 'chunk_id': 20, 'similarity_score': 0.8}
    monkeypatch.setattr(service, 'vector_search', lambda *args, **kwargs: [best, duplicate, other])
    monkeypatch.setattr(service, 'structured_search', lambda *args, **kwargs: [])
    result = service.hybrid_search(None, 'test', None)
    assert result[0]['chunk_id'] == 10
    assert result[0]['similarity_score'] == round(60 / 61, 4)
    assert result[1]['similarity_score'] == round(60 / 62, 4)

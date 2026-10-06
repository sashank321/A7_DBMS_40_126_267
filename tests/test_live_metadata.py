from app.core.config import settings
from app.services.embedding_service import embedding_service

def test_health_reports_server_and_model_metadata(client):
    health=client.get('/api/v1/health').json()
    assert health['components']['postgresql']['server_version']
    assert health['components']['mongodb']['server_version']
    assert health['components']['embeddings']['dimensions']==embedding_service.dim

def test_catalog_reads_database_values(client,admin_headers,db_session):
    from app.models.postgres_models import Department,Category
    response=client.get('/api/v1/catalog',headers=admin_headers)
    assert response.status_code==200
    assert response.json()['departments']==[{'id':d.department_id,'name':d.department_name} for d in db_session.query(Department).order_by(Department.department_name)]
    assert response.json()['categories']==[{'id':c.category_id,'name':c.category_name} for c in db_session.query(Category).order_by(Category.category_name)]
    assert client.get('/api/v1/catalog').status_code==401

def test_permission_editor_uses_real_users_and_requires_ownership(client,admin_headers,employee_headers,db_session):
    from app.models.postgres_models import User
    result=client.get('/api/v1/documents/3/permissions',headers=admin_headers)
    assert result.status_code==200
    assert result.json()['users']==[{'id':u.user_id,'name':u.name} for u in db_session.query(User).order_by(User.name)]
    assert client.get('/api/v1/documents/3/permissions',headers=employee_headers).status_code==403

def test_demo_accounts_follow_configuration(client,monkeypatch,admin_profile):
    monkeypatch.setattr(settings,'DEMO_ACCOUNT_EMAILS',[admin_profile['email']])
    accounts=client.get('/api/v1/auth/demo-accounts').json()
    assert [a['email'] for a in accounts]==[admin_profile['email']]
    assert accounts[0]['name']==admin_profile['name']
    monkeypatch.setattr(settings,'DEMO_ACCOUNT_EMAILS',[])
    assert client.get('/api/v1/auth/demo-accounts').json()==[]

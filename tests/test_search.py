def test_semantic_vector_search(client, admin_headers):
    res = client.post("/api/v1/search", json={
        "query": "What is our employee leave policy and working hours?",
        "top_k": 3
    }, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["route_intent"] in ["SEMANTIC", "HYBRID"]
    assert len(data["results"]) > 0
    result_titles = [r["title"] for r in data["results"]]
    assert any(t in result_titles for t in ["Employee Handbook 2026", "Remote Work Policy"])

def test_structured_search(client, admin_headers):
    res = client.post("/api/v1/search", json={
        "query": "Database Optimization Guide",
        "top_k": 3
    }, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) > 0
    assert any("Optimization" in r["title"] for r in data["results"])

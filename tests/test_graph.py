def test_get_knowledge_graph(client, admin_headers, admin_profile):
    res = client.get("/api/v1/graph", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_nodes"] > 0
    assert data["total_edges"] > 0
    node_names = [n["name"] for n in data["nodes"]]
    assert admin_profile["name"] in node_names
    assert "Engineering" in node_names

def test_entity_connections(client, admin_headers, admin_profile):
    res = client.get("/api/v1/graph/connections", params={"entity": admin_profile["name"]}, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_connections"] > 0

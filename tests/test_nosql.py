def test_submit_document_review(client, admin_headers):
    res = client.post("/api/v1/nosql/reviews", json={
        "document_id": 1,
        "rating": 5,
        "review_text": "Pytest automated review testing MongoDB document insertion."
    }, headers=admin_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["rating"] == 5
    assert "id" in data

def test_mongodb_telemetry_aggregation(client, admin_headers):
    res = client.get("/api/v1/nosql/telemetry", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_activities"] > 0
    assert len(data["top_reviewed_documents"]) > 0

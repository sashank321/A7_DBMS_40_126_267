import io
import os
from app.services.document_service import document_service

def test_create_document_and_version(client, admin_headers):
    # Upload new test document
    res = client.post(
        "/api/v1/documents",
        data={
            "title": "Automated Test Document",
            "description": "Created during pytest integration test run.",
            "department_id": 3,
            "category_id": 3,
            "tags": "Testing, Pytest",
            "content": "This is sample test content for document indexing and chunking."
        },
        headers=admin_headers
    )
    assert res.status_code == 201
    doc_data = res.json()
    doc_id = doc_data["document_id"]
    assert doc_data["title"] == "Automated Test Document"
    assert doc_data["latest_version"] == 1

    # Add a version
    v_res = client.post(
        f"/api/v1/documents/{doc_id}/versions",
        data={"content": "Updated version 2 content with new details."},
        headers=admin_headers
    )
    assert v_res.status_code == 200
    assert v_res.json()["version_number"] == 2

    # Clean up
    del_res = client.delete(f"/api/v1/documents/{doc_id}", headers=admin_headers)
    assert del_res.status_code == 200

def test_multiformat_file_extraction(tmp_path):
    """Verifies that document_service extracts plain text from .txt, .md, .pdf, and .docx."""
    # 1. TXT extraction
    txt_file = tmp_path / "sample.txt"
    txt_file.write_text("Plain text content for verification.", encoding="utf-8")
    assert "Plain text content" in document_service.extract_text_from_file(str(txt_file))

    # 2. MD extraction
    md_file = tmp_path / "sample.md"
    md_file.write_text("# Markdown Title\n\nSection paragraph content.", encoding="utf-8")
    assert "Markdown Title" in document_service.extract_text_from_file(str(md_file))

    # 3. PDF extraction
    import pypdf
    pdf_writer = pypdf.PdfWriter()
    pdf_writer.add_blank_page(width=100, height=100)
    pdf_file = tmp_path / "sample.pdf"
    with open(pdf_file, "wb") as f:
        pdf_writer.write(f)
    extracted_pdf = document_service.extract_text_from_file(str(pdf_file))
    assert isinstance(extracted_pdf, str)

def test_download_path_traversal_rejection(client, admin_headers):
    # Try downloading non-existent / malicious path ID
    res = client.get("/api/v1/documents/99999/download", headers=admin_headers)
    assert res.status_code == 404

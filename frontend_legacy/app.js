const API_BASE = '/api/v1';

let state = {
    token: null,
    user: null,
    documents: [],
    currentTab: 'tab-documents'
};

// Initialize app on load
window.addEventListener('DOMContentLoaded', async () => {
    setupTabNavigation();
    
    // Auto-login as Admin by default for seamless demo
    await quickLogin('alice.admin@knowledgesphere.ai', 'Admin');
});

function setupTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    state.currentTab = tabId;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');

    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');

    const titleMap = {
        'tab-documents': 'Enterprise Documents & Ingestion',
        'tab-search': 'Hybrid Vector & Semantic Search',
        'tab-rag': 'Grounded RAG Copilot (RBAC Enforced)',
        'tab-text2sql': 'Safe Text-to-SQL Analytics Terminal',
        'tab-graph': 'Entity Knowledge Graph & Provenance',
        'tab-nosql': 'MongoDB Polyglot Persistence & Telemetry',
        'tab-audit': 'Security Audit Trail & SQL Window Functions'
    };
    document.getElementById('pageTitle').innerText = titleMap[tabId] || 'KnowledgeSphere AI';

    // Lazy load tab data
    if (tabId === 'tab-documents') loadDocuments();
    if (tabId === 'tab-graph') loadFullGraph();
    if (tabId === 'tab-nosql') loadTelemetry();
    if (tabId === 'tab-audit') loadAuditLogs();
}

// ----------------------------------------------------
// AUTH & QUICK LOGIN SWITCHER
// ----------------------------------------------------
async function quickLogin(email, roleLabel) {
    try {
        const res = await fetch(`${API_BASE}/auth/login-json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password123' })
        });

        if (!res.ok) {
            alert('Login failed');
            return;
        }

        const data = await res.json();
        state.token = data.access_token;
        state.user = {
            id: data.user_id,
            name: data.name,
            email: data.email,
            role: data.role,
            department_id: data.department_id
        };

        // Update UI
        document.getElementById('userName').innerText = data.name;
        document.getElementById('userRoleBadge').innerText = `${data.role} (Dept ${data.department_id})`;
        document.getElementById('userAvatar').innerText = data.name.charAt(0);

        const notice = document.getElementById('docRbacNotice');
        if (notice) {
            notice.innerHTML = `Active Session: <strong>${data.name}</strong> (${data.role}). Role-aware permissions are dynamically enforced at retrieval time.`;
        }

        // Refresh current tab
        if (state.currentTab === 'tab-documents') loadDocuments();
        if (state.currentTab === 'tab-nosql') loadTelemetry();
    } catch (err) {
        console.error('Quick login error:', err);
    }
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${state.token}`,
        'Content-Type': 'application/json'
    };
}

// ----------------------------------------------------
// TAB 1: DOCUMENTS
// ----------------------------------------------------
async function loadDocuments() {
    const tbody = document.getElementById('documentsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Fetching accessible documents...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/documents`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to load documents');
        const docs = await res.json();
        state.documents = docs;

        if (docs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No documents accessible under your current role/permissions.</td></tr>';
            return;
        }

        tbody.innerHTML = docs.map(d => `
            <tr>
                <td><strong>#${d.document_id}</strong></td>
                <td>
                    <div style="font-weight:600;">${d.title}</div>
                    <div style="font-size:11px;color:var(--text-muted);">${d.file_name}</div>
                </td>
                <td>${d.department_name}</td>
                <td>${d.category_name}</td>
                <td><span class="badge" style="background:#475569;">v${d.latest_version}</span></td>
                <td>${d.tags.map(t => `<span class="badge" style="background:rgba(59,130,246,0.2);margin-right:2px;">${t}</span>`).join('')}</td>
                <td>
                    ${d.can_view ? '👁️' : ''} ${d.can_edit ? '✏️' : ''} ${d.can_delete ? '🗑️' : ''}
                </td>
                <td>
                    <a href="${API_BASE}/documents/${d.document_id}/download" class="btn btn-outline" style="padding:4px 8px;font-size:11px;" target="_blank">Download</a>
                </td>
            </tr>
        `).join('');

        // Populate select in MongoDB review tab
        const revSelect = document.getElementById('reviewDocSelect');
        if (revSelect) {
            revSelect.innerHTML = docs.map(d => `<option value="${d.document_id}">${d.title}</option>`).join('');
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error: ${err.message}</td></tr>`;
    }
}

function filterDocumentsTable() {
    const query = document.getElementById('docFilterInput').value.toLowerCase();
    const rows = document.querySelectorAll('#documentsTableBody tr');
    rows.forEach(r => {
        const text = r.innerText.toLowerCase();
        r.style.display = text.includes(query) ? '' : 'none';
    });
}

function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

async function handleDocumentUpload(e) {
    e.preventDefault();
    const title = document.getElementById('upTitle').value;
    const desc = document.getElementById('upDescription').value;
    const dept = document.getElementById('upDept').value;
    const cat = document.getElementById('upCat').value;
    const tags = document.getElementById('upTags').value;
    const content = document.getElementById('upContent').value;
    const fileInput = document.getElementById('upFile');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', desc);
    formData.append('department_id', dept);
    formData.append('category_id', cat);
    formData.append('tags', tags);
    if (content) formData.append('content', content);
    if (fileInput.files[0]) formData.append('file', fileInput.files[0]);

    try {
        const res = await fetch(`${API_BASE}/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.token}` },
            body: formData
        });

        if (!res.ok) throw new Error('Upload failed');
        closeUploadModal();
        alert(`Document '${title}' indexed and uploaded successfully!`);
        loadDocuments();
    } catch (err) {
        alert('Upload Error: ' + err.message);
    }
}

// ----------------------------------------------------
// TAB 2: HYBRID SEARCH
// ----------------------------------------------------
async function runSearch() {
    const q = document.getElementById('searchQueryInput').value.trim();
    if (!q) return;

    const container = document.getElementById('searchResultsContainer');
    container.innerHTML = '<div class="card">Executing hybrid retrieval...</div>';

    try {
        const res = await fetch(`${API_BASE}/search`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ query: q, top_k: 5 })
        });

        const data = await res.json();

        // Update Router Badge
        const badge = document.getElementById('routeIntentBadge');
        badge.innerText = `ROUTE: ${data.route_intent}`;
        badge.style.backgroundColor = data.route_intent === 'SEMANTIC' ? '#8b5cf6' : data.route_intent === 'STRUCTURED' ? '#10b981' : '#3b82f6';

        if (data.results.length === 0) {
            container.innerHTML = '<div class="card text-muted">No relevant matches found within your authorized documents.</div>';
            return;
        }

        container.innerHTML = data.results.map((r, idx) => `
            <div class="result-item-card">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h4>#${idx + 1}. ${r.title}</h4>
                    <div>
                        <span class="badge" style="background:#475569;">Mode: ${r.retrieval_mode}</span>
                        <span class="badge" style="background:#10b981;">Score: ${(r.similarity_score * 100).toFixed(1)}%</span>
                    </div>
                </div>
                <p style="font-size:13px;color:#cbd5e1;margin-top:6px;line-height:1.5;">${r.content_snippet}</p>
                <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">
                    Provenance: Doc ID ${r.document_id} | Chunk #${r.chunk_number || 1}
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div class="card text-danger">Search Error: ${err.message}</div>`;
    }
}

// ----------------------------------------------------
// TAB 3: RAG ASSISTANT
// ----------------------------------------------------
function setRAGQuery(q) {
    document.getElementById('ragQuestionInput').value = q;
    runRAG();
}

async function runRAG() {
    const question = document.getElementById('ragQuestionInput').value.trim();
    if (!question) return;

    const container = document.getElementById('ragResponseContainer');
    container.innerHTML = '<div class="card">Assembling role-filtered context & generating grounded answer...</div>';

    try {
        const res = await fetch(`${API_BASE}/rag/query`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ question, top_k: 4 })
        });

        const data = await res.json();

        container.innerHTML = `
            <div class="rag-answer-box">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span class="badge" style="background:#8b5cf6;">Intent: ${data.route_intent}</span>
                        <span class="badge" style="background:#10b981;">Confidence: ${(data.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                        <span class="badge" style="background:${data.unauthorized_documents_filtered > 0 ? '#ef4444' : '#10b981'};">
                            🔒 ${data.unauthorized_documents_filtered} Unauthorized Docs Blocked
                        </span>
                    </div>
                </div>

                <div style="font-size:14px;line-height:1.6;white-space:pre-line;color:#f1f5f9;">
                    ${data.answer}
                </div>

                ${data.citations.length > 0 ? `
                    <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">
                        <h4 style="font-size:13px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Exact Source Citations:</h4>
                        <div class="citations-list">
                            ${data.citations.map(c => `
                                <div class="citation-chip">
                                    <strong>[Document: ${c.title} (v${c.version_number})]</strong> - Chunk #${c.chunk_id}
                                    <div style="color:var(--text-muted);margin-top:2px;">"${c.snippet}"</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div style="font-size:11px;color:var(--text-muted);margin-top:16px;">
                    Reasoning: ${data.reasoning || 'Pre-retrieval RBAC filtering applied before synthesis.'}
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="card text-danger">RAG Error: ${err.message}</div>`;
    }
}

// ----------------------------------------------------
// TAB 4: TEXT-TO-SQL
// ----------------------------------------------------
function setSQLQuery(q) {
    document.getElementById('sqlNaturalInput').value = q;
    runText2SQL();
}

async function runText2SQL() {
    const q = document.getElementById('sqlNaturalInput').value.trim();
    if (!q) return;

    const container = document.getElementById('sqlResultContainer');
    container.innerHTML = '<div class="card">Validating AST and executing safe SQL against PostgreSQL...</div>';

    try {
        const res = await fetch(`${API_BASE}/text2sql`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ natural_query: q })
        });

        const data = await res.json();

        container.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <span class="badge" style="background:${data.is_safe ? '#10b981' : '#ef4444'};">
                        ${data.status}: ${data.is_safe ? 'Safe SELECT Validated' : 'SECURITY REJECTION'}
                    </span>
                    <span style="font-size:12px;color:var(--text-muted);">Execution Time: ${data.execution_time_ms} ms</span>
                </div>

                <div style="background:#0f172a;padding:12px;border-radius:6px;font-family:monospace;font-size:12px;color:#38bdf8;margin-bottom:16px;white-space:pre-wrap;">
${data.generated_sql}
                </div>

                <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">${data.explanation}</p>

                ${data.row_count > 0 ? `
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>${data.columns.map(c => `<th>${c}</th>`).join('')}</tr>
                            </thead>
                            <tbody>
                                ${data.results.map(row => `
                                    <tr>${data.columns.map(c => `<td>${row[c]}</td>`).join('')}</tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `<div class="text-muted" style="font-size:13px;">No tabular rows returned.</div>`}
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="card text-danger">Text-to-SQL Error: ${err.message}</div>`;
    }
}

// ----------------------------------------------------
// TAB 5: KNOWLEDGE GRAPH
// ----------------------------------------------------
async function loadFullGraph() {
    const statsDiv = document.getElementById('graphStats');
    const visDiv = document.getElementById('graphVisualization');
    statsDiv.innerText = 'Fetching PostgreSQL knowledge graph entities...';

    try {
        const res = await fetch(`${API_BASE}/graph?limit=50`, { headers: getAuthHeaders() });
        const data = await res.json();

        statsDiv.innerHTML = `Total Entities: <strong>${data.total_nodes}</strong> | Total Relational Edges: <strong>${data.total_edges}</strong>`;

        visDiv.innerHTML = data.nodes.map(n => `
            <div style="background:var(--bg-input);padding:12px;border-radius:8px;border-left:3px solid #3b82f6;">
                <div style="font-weight:600;font-size:13px;">${n.name}</div>
                <div style="font-size:11px;color:#38bdf8;">TYPE: ${n.type}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${n.description || ''}</div>
            </div>
        `).join('');
    } catch (err) {
        statsDiv.innerText = 'Failed to load graph: ' + err.message;
    }
}

async function searchEntityConnections() {
    const term = document.getElementById('graphSearchInput').value.trim();
    if (!term) return;

    const statsDiv = document.getElementById('graphStats');
    const visDiv = document.getElementById('graphVisualization');
    statsDiv.innerText = `Searching connections for '${term}'...`;

    try {
        const res = await fetch(`${API_BASE}/graph/connections?entity=${encodeURIComponent(term)}`, { headers: getAuthHeaders() });
        const data = await res.json();

        statsDiv.innerHTML = `Found <strong>${data.total_connections}</strong> connection(s) for <strong>${term}</strong>:`;

        if (data.connections.length === 0) {
            visDiv.innerHTML = '<div class="text-muted">No explicit graph relationships found for this entity.</div>';
            return;
        }

        visDiv.innerHTML = data.connections.map(c => `
            <div style="background:var(--bg-input);padding:12px;border-radius:8px;border-left:3px solid #10b981;">
                <div style="font-size:13px;">
                    <strong>${c.source}</strong> ──[<span style="color:#f59e0b;">${c.relation}</span>]──> <strong>${c.target}</strong>
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Direction: ${c.direction}</div>
            </div>
        `).join('');
    } catch (err) {
        statsDiv.innerText = 'Error: ' + err.message;
    }
}

// ----------------------------------------------------
// TAB 6: NOSQL TELEMETRY & REVIEWS
// ----------------------------------------------------
async function loadTelemetry() {
    const grid = document.getElementById('telemetryGrid');
    grid.innerHTML = 'Querying MongoDB aggregation pipelines...';

    try {
        const res = await fetch(`${API_BASE}/nosql/telemetry`, { headers: getAuthHeaders() });
        const data = await res.json();

        grid.innerHTML = `
            <div class="telemetry-stat-card">
                <div style="font-size:12px;color:var(--text-muted);">Total NoSQL Activities Logged</div>
                <div class="telemetry-stat-num">${data.total_activities}</div>
            </div>
            <div class="telemetry-stat-card">
                <div style="font-size:12px;color:var(--text-muted);">Action Type Distribution ($group)</div>
                <div style="font-size:12px;margin-top:8px;">
                    ${Object.entries(data.action_type_distribution).map(([act, cnt]) => `
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span>${act}</span><strong>${cnt}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="telemetry-stat-card">
                <div style="font-size:12px;color:var(--text-muted);">Average Document Ratings ($avg)</div>
                <div style="font-size:12px;margin-top:8px;">
                    ${data.top_reviewed_documents.map(r => `
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span>Doc #${r.document_id}</span>
                            <span>⭐ ${r.average_rating} (${r.review_count} revs)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (err) {
        grid.innerHTML = '<div class="text-danger">Failed to load MongoDB telemetry: ' + err.message + '</div>';
    }
}

async function submitReview() {
    const docId = document.getElementById('reviewDocSelect').value;
    const rating = document.getElementById('reviewRatingSelect').value;
    const text = document.getElementById('reviewTextInput').value.trim();
    if (!text) {
        alert('Please enter review text');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/nosql/reviews`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                document_id: parseInt(docId),
                rating: parseInt(rating),
                review_text: text
            })
        });

        if (!res.ok) throw new Error('Failed to submit review');
        alert('Review saved to MongoDB collection document_reviews!');
        document.getElementById('reviewTextInput').value = '';
        loadTelemetry();
    } catch (err) {
        alert('Review error: ' + err.message);
    }
}

// ----------------------------------------------------
// TAB 7: AUDIT LOGS
// ----------------------------------------------------
async function loadAuditLogs() {
    const tbody = document.getElementById('auditTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading audit records from PostgreSQL...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/audit`, { headers: getAuthHeaders() });
        const logs = await res.json();

        tbody.innerHTML = logs.map(l => `
            <tr>
                <td>#${l.log_id}</td>
                <td>${l.user_name}</td>
                <td><span class="badge" style="background:#475569;">${l.action}</span></td>
                <td>${l.document_title || 'N/A'}</td>
                <td>${l.created_at ? new Date(l.created_at).toLocaleString() : ''}</td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Audit Error: ${err.message}</td></tr>`;
    }
}

async function loadAuditAnalytics() {
    const container = document.getElementById('auditContainer');
    try {
        const res = await fetch(`${API_BASE}/audit/analytics`, { headers: getAuthHeaders() });
        const data = await res.json();

        container.innerHTML = `
            <div style="padding:16px;">
                <h4>View: ${data.view}</h4>
                <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">${data.description}</p>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Log ID</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Prev Action (LAG)</th>
                                <th>Recency Rank (ROW_NUMBER)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.rows.map(r => `
                                <tr>
                                    <td>#${r.log_id}</td>
                                    <td>${r.user_name}</td>
                                    <td>${r.action}</td>
                                    <td>${r.previous_user_action || 'None (First Action)'}</td>
                                    <td><strong>#${r.user_action_recency_rank}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        alert('Analytics error: ' + err.message);
    }
}

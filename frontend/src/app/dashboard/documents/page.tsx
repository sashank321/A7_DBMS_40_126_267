"use client";

import { usePlatform, useDemoAccounts } from "@/lib/platform";
import { apiErrorMessage } from "@/lib/utils";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Plus,
  Shield,
  Layers,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Search
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { DocumentItem } from "@/types";

export default function DocumentsPage() {
  const platform = usePlatform();
  const { data: catalog } = useQuery({ queryKey: ["catalog"], queryFn: api.getCatalog });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
  const [searchFilter, setSearchFilter] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [versionDoc, setVersionDoc] = useState<DocumentItem | null>(null);
  const [versionContent, setVersionContent] = useState("");
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [permissionDoc, setPermissionDoc] = useState<DocumentItem | null>(null);
  const [permissionUser, setPermissionUser] = useState(0);
  const [permission, setPermission] = useState({ can_view: true, can_edit: false, can_delete: false });
  React.useEffect(() => { if (user?.role !== "Admin" && (user as any)?.departmentId) setDepartmentId((user as any).departmentId); }, [user]);
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState(0);
  const [categoryId, setCategoryId] = useState(0);
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ["documents-list", selectedDept],
    queryFn: () => api.getDocuments(selectedDept),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("department_id", String(user?.role === "Admin" ? departmentId : (user as any).departmentId || departmentId));
      formData.append("category_id", String(categoryId));
      formData.append("tags", tags);
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else if (content.trim()) {
        formData.append("content", content);
      }
      return api.createDocument(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setStatusMsg({ type: "success", text: "Document saved and indexed." });
      setIsUploadOpen(false);
      setTitle("");
      setDescription("");
      setContent("");
      setSelectedFile(null);
    },
    onError: (err: any) => {
      setStatusMsg({ type: "error", text: apiErrorMessage(err, "Upload failed.") });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) => api.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setStatusMsg({ type: "success", text: "Document deleted." });
    }
  });

  const versionMutation = useMutation({
    mutationFn: async () => { const data = new FormData(); if (versionFile) data.append("file", versionFile); else data.append("content", versionContent); return api.addDocumentVersion(versionDoc!.document_id, data); },
    onSuccess: () => { queryClient.invalidateQueries(); setVersionDoc(null); setVersionContent(""); setVersionFile(null); setStatusMsg({ type: "success", text: "New version saved and indexed." }); },
    onError: () => setStatusMsg({ type: "error", text: "The new version could not be saved." }),
  });
  const { data: permissionEditor, isLoading: permissionLoading, error: permissionError } = useQuery({ queryKey: ["permission-editor", permissionDoc?.document_id], queryFn: () => api.getPermissionEditor(permissionDoc!.document_id), enabled: !!permissionDoc });
  React.useEffect(() => {
    const grant = permissionEditor?.permissions.find(p => p.user_id === permissionUser);
    setPermission({ can_view: grant?.can_view ?? false, can_edit: grant?.can_edit ?? false, can_delete: grant?.can_delete ?? false });
  }, [permissionEditor, permissionUser]);
  const permissionMutation = useMutation({
    mutationFn: () => api.updateDocumentPermissions(permissionDoc!.document_id, { user_id: permissionUser, ...permission }),
    onSuccess: () => { queryClient.invalidateQueries(); setPermissionDoc(null); setStatusMsg({ type: "success", text: "Document permissions updated." }); },
    onError: () => setStatusMsg({ type: "error", text: "Permissions could not be updated. Check the target user and your access." }),
  });
  const download = async (doc: DocumentItem) => { try { await api.downloadDocument(doc.document_id, doc.file_name || "document.txt"); } catch { setStatusMsg({ type: "error", text: "Document download failed." }); } };
  const docs = (documents || []).filter((doc) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      doc.title.toLowerCase().includes(term) ||
      (doc.description && doc.description.toLowerCase().includes(term)) ||
      doc.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 select-none font-sans text-ink-black pb-12">
      {error && <p role="alert" className="text-red-700">Unable to load documents. Please retry.</p>}
      {deleteMutation.isError && <p role="alert" className="text-red-700">The document could not be deleted.</p>}
      {/* Top Banner */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-space text-[10px] text-muted tracking-widest uppercase mb-1">
            <span>[ 3NF RELATIONAL STORE ]</span>
            <span>{"//"}</span>
            <span className="text-accent-orange font-bold">{platform.pgLabel} Document Catalog</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-ink-black">
            Document <span className="text-accent-orange italic font-normal">Explorer</span>
          </h1>
          <p className="text-xs font-space text-muted mt-1">
            Current RBAC Scope: <strong className="text-ink-black font-bold">[{user?.role}]</strong> {user?.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-ink-black text-beige-bg font-space text-xs uppercase tracking-wider font-bold rounded-lg shadow hover:bg-accent-orange transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ingest Document
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-lg text-xs font-space flex items-center justify-between ${
          statusMsg.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-space text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted" />
          <span className="text-muted uppercase text-[10px]">Filter Department:</span>
          {[{ id: undefined, label: "All Depts" }, ...(catalog?.departments || []).map(d => ({ id: d.id, label: d.name }))].map((dept) => (
            <button
              key={String(dept.id)}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-colors ${
                selectedDept === dept.id
                  ? "bg-ink-black text-beige-bg"
                  : "bg-white border border-ink-black/10 text-muted hover:text-ink-black"
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            placeholder="Search documents by title, tags..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-ink-black/15 rounded-lg text-xs font-sans focus:outline-none focus:border-accent-orange bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Document Table */}
      <div className="border border-ink-black/10 bg-white rounded-2xl shadow-sm overflow-x-auto font-space">
        <table className="w-full min-w-[800px] text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-ink-black/10 bg-black/5 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-4">ID</th>
              <th className="p-4">Title & Details</th>
              <th className="p-4">Department</th>
              <th className="p-4">Category</th>
              <th className="p-4">Version</th>
              <th className="p-4">Owner</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-black/5">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  Loading authorized documents...
                </td>
              </tr>
            ) : docs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  No documents found matching the filter or role restrictions.
                </td>
              </tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.document_id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="p-4 font-mono font-bold text-accent-orange">#{doc.document_id}</td>
                  <td className="p-4">
                    <p className="font-bold text-ink-black text-sm">{doc.title}</p>
                    <p className="text-[10px] text-muted line-clamp-1 mt-0.5">{doc.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {doc.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.2 text-[8px] bg-black/5 rounded text-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-muted">{doc.department_name}</td>
                  <td className="p-4 text-muted">{doc.category_name}</td>
                  <td className="p-4 font-mono">
                    <span className="px-2 py-0.5 bg-black/5 rounded font-bold">
                      v{doc.latest_version}
                    </span>
                  </td>
                  <td className="p-4 text-muted">{doc.uploader_name}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => download(doc)} title="Download Document" className="p-1.5 text-muted hover:text-accent-orange"><Download className="h-4 w-4" /></button>
                    {doc.can_edit && <button onClick={() => { setVersionContent(""); setVersionFile(null); versionMutation.reset(); setVersionDoc(doc); }} title="Add Version" className="p-1.5 text-muted hover:text-accent-orange"><Layers className="h-4 w-4" /></button>}
                    {(user?.role === "Admin" || Number(user?.id) === doc.uploaded_by) && <button onClick={() => { setPermissionUser(0); setPermission({ can_view: true, can_edit: false, can_delete: false }); permissionMutation.reset(); setPermissionDoc(doc); }} title="Manage Permissions" className="p-1.5 text-muted hover:text-accent-orange"><Shield className="h-4 w-4" /></button>}
                    {doc.can_delete && (
                      <button
                        onClick={() => { if (window.confirm(`Delete "${doc.title}" and its versions?`)) deleteMutation.mutate(doc.document_id); }}
                        className="p-1.5 text-muted hover:text-red-600 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <Modal label="Ingest document" onClose={() => setIsUploadOpen(false)} busy={uploadMutation.isPending}>
          <div className="bg-white border border-ink-black/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-ink-black/10 pb-3">
              <h3 className="font-heading text-xl font-bold text-ink-black">Ingest New Enterprise Document</h3>
              <button aria-label="Close upload" disabled={uploadMutation.isPending} onClick={() => setIsUploadOpen(false)} className="text-muted hover:text-ink-black">✕</button>
            </div>

            {uploadMutation.isError && <p role="alert" className="text-sm text-red-700">{apiErrorMessage(uploadMutation.error, "Upload failed. Please retry.")}</p>}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-1">Document Title</label>
                <input
                  type="text"
                  aria-label="Document title"
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Database Architecture"
                  className="w-full p-2.5 border border-ink-black/15 rounded-lg focus:outline-none focus:border-accent-orange"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of document purpose"
                  className="w-full p-2.5 border border-ink-black/15 rounded-lg focus:outline-none focus:border-accent-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-muted font-bold mb-1">Department</label>
                  <select
                    value={departmentId}
                    disabled={user?.role !== "Admin"}
                  onChange={(e) => setDepartmentId(Number(e.target.value))}
                    className="w-full p-2.5 border border-ink-black/15 rounded-lg bg-white"
                  >
                    <option value={0}>Select department</option>
                    {(catalog?.departments || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted font-bold mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full p-2.5 border border-ink-black/15 rounded-lg bg-white"
                  >
                    <option value={0}>Select category</option>
                    {(catalog?.categories || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Engineering, Database, Architecture"
                  className="w-full p-2.5 border border-ink-black/15 rounded-lg focus:outline-none focus:border-accent-orange"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-1">Upload File (.txt, .md, .pdf, .docx)</label>
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.docx,.json,.csv,.sql,.py"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black/5 file:text-ink-black hover:file:bg-black/10"
                />
              </div>

              {!selectedFile && (
                <div>
                  <label className="block text-[10px] uppercase text-muted font-bold mb-1">Or Paste Text Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="Enter document raw body text..."
                    className="w-full p-2.5 border border-ink-black/15 rounded-lg focus:outline-none focus:border-accent-orange"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-ink-black/10">
              <button
                disabled={uploadMutation.isPending}
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 border border-ink-black/15 rounded-lg text-muted hover:text-ink-black"
              >
                Cancel
              </button>
              <button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending || !title.trim() || !departmentId || !categoryId || (!selectedFile && !content.trim())}
                className="px-5 py-2 bg-ink-black text-beige-bg font-bold rounded-lg hover:bg-accent-orange transition-colors disabled:opacity-50"
              >
                {uploadMutation.isPending ? "Ingesting & Embedding..." : "Ingest & Vectorize"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {versionDoc && <Modal label="Add document version" onClose={() => setVersionDoc(null)} busy={versionMutation.isPending}><section className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4" aria-label="Add document version">
        <h2 className="text-xl font-bold">New version: {versionDoc.title}</h2>
        {versionMutation.isError && <p role="alert" className="text-red-700">{apiErrorMessage(versionMutation.error, "Version could not be saved.")}</p>}
        <textarea aria-label="Version content" value={versionContent} onChange={e => setVersionContent(e.target.value)} placeholder="Updated document content" className="w-full border rounded p-3 min-h-32" />
        <input aria-label="Version file" type="file" accept=".txt,.md,.pdf,.docx" onChange={e => setVersionFile(e.target.files?.[0] || null)} />
        <div className="flex gap-3"><button disabled={versionMutation.isPending || (!versionFile && !versionContent.trim())} onClick={() => versionMutation.mutate()} className="bg-ink-black text-white p-3 rounded">Save Version</button><button disabled={versionMutation.isPending} onClick={() => setVersionDoc(null)}>Cancel</button></div>
      </section></Modal>}
      {permissionDoc && <Modal label="Document permissions" onClose={() => setPermissionDoc(null)} busy={permissionMutation.isPending}><section className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4" aria-label="Document permissions">
        <h2 className="text-xl font-bold">Permissions: {permissionDoc.title}</h2>
        {permissionError && <p role="alert" className="text-red-700">Unable to load saved permissions. Please reopen this dialog.</p>}
        {permissionMutation.isError && <p role="alert" className="text-red-700">{apiErrorMessage(permissionMutation.error, "Permissions could not be saved.")}</p>}
        <label className="block">Target user<select aria-label="Target user" value={permissionUser} onChange={e => setPermissionUser(Number(e.target.value))} className="border p-2 ml-3"><option value={0}>Select a user</option>{permissionEditor?.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
        {(["can_view", "can_edit", "can_delete"] as const).map(key => <label className="block" key={key}><input type="checkbox" checked={permission[key]} onChange={e => setPermission({ ...permission, [key]: e.target.checked })} /> {key.replace("can_", "Allow ")}</label>)}
        <p className="text-xs text-muted">Admin, owner and department manager access follows the platform role rules. These settings control explicit grants.</p>
        <div className="flex gap-3"><button disabled={permissionMutation.isPending || permissionLoading || !!permissionError || permissionUser < 1} onClick={() => permissionMutation.mutate()} className="bg-ink-black text-white p-3 rounded">Save Permissions</button><button disabled={permissionMutation.isPending} onClick={() => setPermissionDoc(null)}>Cancel</button></div>
      </section></Modal>}
    </div>
  );
}

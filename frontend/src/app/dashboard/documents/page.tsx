"use client";

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
  Filter
} from "lucide-react";
import type { DocumentItem } from "@/types";

export default function DocumentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState(3);
  const [categoryId, setCategoryId] = useState(3);
  const [tags, setTags] = useState("AI, Documentation, Enterprise");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents-list", selectedDept],
    queryFn: () => api.getDocuments(selectedDept),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("department_id", String(departmentId));
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
      queryClient.invalidateQueries({ queryKey: ["documents-list"] });
      setStatusMsg({ type: "success", text: "Document ingested and 384-dim vectors indexed!" });
      setIsUploadOpen(false);
      setTitle("");
      setDescription("");
      setContent("");
      setSelectedFile(null);
    },
    onError: (err: any) => {
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Upload failed." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) => api.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents-list"] });
      setStatusMsg({ type: "success", text: "Document deleted." });
    }
  });

  const docs = documents || [];

  return (
    <div className="space-y-6 select-none font-sans text-ink-black pb-12">
      {/* Top Banner */}
      <div className="border border-ink-black/10 bg-white p-6 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-space text-[10px] text-muted tracking-widest uppercase mb-1">
            <span>[ 3NF RELATIONAL STORE ]</span>
            <span>//</span>
            <span className="text-accent-orange font-bold">PostgreSQL 18.4 Document Catalog</span>
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
      <div className="flex items-center gap-3 font-space text-xs">
        <Filter className="h-3.5 w-3.5 text-muted" />
        <span className="text-muted uppercase text-[10px]">Filter Department:</span>
        {[
          { id: undefined, label: "All Depts" },
          { id: 1, label: "HR" },
          { id: 2, label: "Finance" },
          { id: 3, label: "Engineering" },
          { id: 4, label: "Marketing" },
          { id: 5, label: "Legal" },
        ].map((dept) => (
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

      {/* Document Table */}
      <div className="border border-ink-black/10 bg-white rounded-2xl shadow-sm overflow-hidden font-space">
        <table className="w-full text-left border-collapse text-xs">
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
                    {doc.can_delete && (
                      <button
                        onClick={() => deleteMutation.mutate(doc.document_id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-space">
          <div className="bg-white border border-ink-black/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-ink-black/10 pb-3">
              <h3 className="font-heading text-xl font-bold text-ink-black">Ingest New Enterprise Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-muted hover:text-ink-black">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-1">Document Title</label>
                <input
                  type="text"
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
                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                    className="w-full p-2.5 border border-ink-black/15 rounded-lg bg-white"
                  >
                    <option value={1}>Human Resources</option>
                    <option value={2}>Finance</option>
                    <option value={3}>Engineering</option>
                    <option value={4}>Marketing</option>
                    <option value={5}>Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted font-bold mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full p-2.5 border border-ink-black/15 rounded-lg bg-white"
                  >
                    <option value={1}>HR Policies</option>
                    <option value={2}>Financial Reports</option>
                    <option value={3}>Technical Documentation</option>
                    <option value={4}>Marketing Strategy</option>
                    <option value={5}>Legal Contracts</option>
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
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 border border-ink-black/15 rounded-lg text-muted hover:text-ink-black"
              >
                Cancel
              </button>
              <button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending || !title.trim()}
                className="px-5 py-2 bg-ink-black text-beige-bg font-bold rounded-lg hover:bg-accent-orange transition-colors disabled:opacity-50"
              >
                {uploadMutation.isPending ? "Ingesting & Embedding..." : "Ingest & Vectorize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

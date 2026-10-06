import axios from "axios";
import type { DocumentItem, RAGResponse, SearchResponse, Text2SQLResponse, GraphResponse, MongoTelemetry, KnowledgeSphereUser } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("knowledgesphere_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to catch 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const loginRequest = /\/auth\/login(?:-json)?$/.test(error.config?.url || "");
      const currentToken = localStorage.getItem("knowledgesphere_token");
      const requestToken = error.config?.headers?.Authorization;
      if (!loginRequest && currentToken && requestToken === `Bearer ${currentToken}`) {
        localStorage.removeItem("knowledgesphere_token");
        localStorage.removeItem("knowledgesphere_user");
        localStorage.removeItem("allocflow_token");
        localStorage.removeItem("allocflow_user");
        window.dispatchEvent(new Event("knowledgesphere:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  getDemoAccounts: async (): Promise<{ email: string; name: string; role: string; department_name: string }[]> => {
    const res = await apiClient.get("/auth/demo-accounts");
    return res.data;
  },
  // KnowledgeSphere AI Auth & 2FA OTP
  requestOTP: async (email: string, password: string): Promise<{ status: string; message: string; email: string; expires_in_seconds: number; dev_otp?: string }> => {
    const res = await apiClient.post("/auth/request-otp", { email, password });
    return res.data;
  },
  verifyOTP: async (email: string, otp: string): Promise<any> => {
    const res = await apiClient.post("/auth/verify-otp", { email, otp });
    if (typeof window !== "undefined" && res.data.access_token) {
      localStorage.setItem("knowledgesphere_token", res.data.access_token);
      localStorage.setItem("knowledgesphere_user", JSON.stringify(res.data));
    }
    return res.data;
  },
  resendOTP: async (email: string): Promise<{ status: string; message: string; email: string; expires_in_seconds: number; dev_otp?: string }> => {
    const res = await apiClient.post("/auth/resend-otp", { email });
    return res.data;
  },
  knowledgesphereLogin: async (email: string, password: string): Promise<any> => {
    const res = await apiClient.post("/auth/login-json", { email, password });
    if (typeof window !== "undefined" && res.data.access_token) {
      localStorage.setItem("knowledgesphere_token", res.data.access_token);
      localStorage.setItem("knowledgesphere_user", JSON.stringify(res.data));
    }
    return res.data;
  },

  getCurrentUser: async (): Promise<KnowledgeSphereUser> => {
    const res = await apiClient.get<KnowledgeSphereUser>("/auth/me");
    return res.data;
  },

  // KnowledgeSphere AI Documents
  getDocuments: async (departmentId?: number, categoryId?: number): Promise<DocumentItem[]> => {
    const res = await apiClient.get<DocumentItem[]>("/documents", {
      params: {
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(categoryId ? { category_id: categoryId } : {})
      }
    });
    return res.data;
  },
  createDocument: async (formData: FormData): Promise<DocumentItem> => {
    const res = await apiClient.post<DocumentItem>("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  },
  addDocumentVersion: async (documentId: number, formData: FormData): Promise<any> => {
    const res = await apiClient.post(`/documents/${documentId}/versions`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  },
  deleteDocument: async (documentId: number): Promise<any> => {
    const res = await apiClient.delete(`/documents/${documentId}`);
    return res.data;
  },

  // KnowledgeSphere AI Search & RAG
  search: async (query: string, top_k: number = 5, department_id?: number, category_id?: number): Promise<SearchResponse> => {
    const res = await apiClient.post<SearchResponse>("/search", {
      query,
      top_k,
      department_id,
      category_id
    });
    return res.data;
  },
  ragQuery: async (question: string, top_k: number = 4): Promise<RAGResponse> => {
    const res = await apiClient.post<RAGResponse>("/rag/query", { question, top_k });
    return res.data;
  },

  // Safe Text-to-SQL
  text2sql: async (query: string): Promise<Text2SQLResponse> => {
    const res = await apiClient.post<Text2SQLResponse>("/text2sql", { natural_query: query });
    return res.data;
  },

  // Knowledge Graph
  getGraph: async (limit: number = 50): Promise<GraphResponse> => {
    const res = await apiClient.get<GraphResponse>("/graph", { params: { limit } });
    return res.data;
  },

  // NoSQL Telemetry & Reviews (MongoDB)
  getMongoTelemetry: async (): Promise<MongoTelemetry> => {
    const res = await apiClient.get<MongoTelemetry>("/nosql/telemetry");
    return res.data;
  },
  submitReview: async (documentId: number, rating: number, comment: string): Promise<any> => {
    const res = await apiClient.post("/nosql/reviews", {
      document_id: documentId,
      rating,
      review_text: comment
    });
    return res.data;
  },

  // Health check
  getHealth: async (): Promise<any> => {
    const res = await apiClient.get("/health");
    return res.data;
  },

  // Audit analytics
  getAuditAnalytics: async (): Promise<any[]> => {
    const res = await apiClient.get("/audit/analytics");
    return res.data.rows;
  },

  getAccessMatrix: async (): Promise<any[]> => {
    const res = await apiClient.get("/audit/access-matrix");
    return res.data.rows;
  },
  getUsers: async (): Promise<KnowledgeSphereUser[]> => {
    const res = await apiClient.get("/users");
    return res.data;
  },
  updateDocumentPermissions: async (documentId: number, permission: { user_id: number; can_view: boolean; can_edit: boolean; can_delete: boolean }) => {
    const res = await apiClient.put(`/documents/${documentId}/permissions`, permission);
    return res.data;
  },
  downloadDocument: async (documentId: number, filename: string) => {
    const res = await apiClient.get(`/documents/${documentId}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  getAuditLogs: async (): Promise<any[]> => (await apiClient.get("/audit")).data,
  getCatalog: async (): Promise<{ departments: { id: number; name: string }[]; categories: { id: number; name: string }[] }> => (await apiClient.get("/catalog")).data,
  getPermissionEditor: async (id: number): Promise<{ users: { id: number; name: string }[]; permissions: { user_id: number; can_view: boolean; can_edit: boolean; can_delete: boolean }[] }> => (await apiClient.get(`/documents/${id}/permissions`)).data,
};

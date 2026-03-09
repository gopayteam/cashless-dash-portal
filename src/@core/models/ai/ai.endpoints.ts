// ============================================================
// AI Services — API Endpoints
// Add these into your existing API_ENDPOINTS object
// ============================================================

export const AI_ENDPOINTS = {
  // ── Chatbot (via intent_module) ──────────────────────────
  CHAT_SEND: '/api/v1/chatbot/chat',          // Full orchestration pipeline
  CHAT_DETECT: '/api/v1/chatbot/detect',      // Intent detection only
  CHAT_HISTORY: '/api/v1/chatbot/history',    // (Requires implementation in service)
  CHAT_SESSION_CLEAR: '/api/v1/chatbot/session/clear',

  // ── RAG Module ───────────────────────────────────────────
  RAG_QUERY: '/api/v1/rag/query',             // Full RAG (Retrieve + Gen)
  RAG_RETRIEVE: '/api/v1/rag/retrieve',       // Retrieval only
  RAG_DOCUMENTS_LIST: '/api/v1/rag/documents',
  RAG_DOCUMENT_UPLOAD: '/api/v1/rag/documents/upload',
  RAG_DOCUMENT_DELETE: '/api/v1/rag/documents',       // DELETE /:id

  // ── FAQ (RAG data) ───────────────────────────────────────
  FAQ_LIST: '/api/v1/rag/faq',
  FAQ_CREATE: '/api/v1/rag/faq',
  FAQ_UPDATE: '/api/v1/rag/faq',             // PUT /:id
  FAQ_DELETE: '/api/v1/rag/faq',             // DELETE /:id
  FAQ_INGEST: '/api/v1/rag/faq/ingest',      // re-embed all

  // ── Intent Module ────────────────────────────────────────
  INTENT_LIST: '/api/v1/intent/admin/intents',
  INTENT_CREATE: '/api/v1/intent/admin/intents',
  INTENT_UPDATE: '/api/v1/intent/admin/intents',      // PUT /:id
  INTENT_DELETE: '/api/v1/intent/admin/intents',      // DELETE /:id
  INTENT_MODEL_STATUS: '/api/v1/intent/admin/status',
  INTENT_RETRAIN: '/api/v1/intent/admin/train',
};


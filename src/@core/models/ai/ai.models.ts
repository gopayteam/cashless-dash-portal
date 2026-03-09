// ============================================================
// AI Services — Shared TypeScript Models
// ============================================================


// ── Generic API Envelope ─────────────────────────────────────────────────────

export interface ApiMeta {
  request_id: string;
  service: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: ApiMeta;
}


// ── Chat ─────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'delivered' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status?: MessageStatus;
  sources?: RagSource[];
  intentDetected?: string;
  confidence?: number;
}

export interface ChatRequest {
  entityId: string;
  sessionId?: string;
  text: string;
  useRag?: boolean;
}

export interface ChatResponseData {
  conversation_id: string | null;
  message: string;
  response: string;
  intent: string;
  confidence: number;
  sources: RagSource[];
  workflow: string | null;
  tokens_used: number | null;
  rag_source_used: string | null;
  latency_ms: number | null;
  created_at: string;
}

export type ChatResponse = ApiResponse<ChatResponseData>;


// ── Intents ───────────────────────────────────────────────────────────────────

export interface TrainingPhrase {
  id?: string;
  text: string;
}

export interface FetchApiIntent {
  intents: Intent[];
}

export interface Intent {
  tag: string;
  patterns: string[];
  responses: string[];

  // UI optional fields
  id?: string;
  displayName?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IntentCreateRequest {
  name: string;
  displayName: string;
  tag: string;
  patterns: string[];
  responses: string[];
  trainingPhrases: string[];
  description?: string;
}

export interface IntentUpdateRequest extends Partial<IntentCreateRequest> {
  isActive?: boolean;
}


// ── Model / Training ──────────────────────────────────────────────────────────

export interface ModelStatus {
  status: 'ready' | 'training' | 'loading' | 'error' | 'not_trained';
  accuracy?: number;
  device: string;
  tags: string[];
  totalIntents: number;
  totalPhrases: number;
  lastTrainedAt?: Date;
  trainingDurationMs?: number;
}

export interface ModelStatusResponse {
  model: {
    loaded: boolean;
    device: string;
    vocab_size: number;
    num_tags: number;
    tags: string[];
  };
  intent_store: {
    source: string;
    intents: number;
    tags: string[];
  };
}

export interface RetrainResponse {
  jobId: string;
  status: 'queued' | 'running';
  message: string;
}


// ── RAG ───────────────────────────────────────────────────────────────────────

export interface RagSource {
  documentId: string;
  title: string;
  excerpt: string;
  score: number;
  sourceType: 'faq' | 'document';
}

export interface RagQueryRequest {
  entityId: string;
  query: string;
  topK?: number;
}

export interface RagQueryResponse {
  answer: string;
  sources: RagSource[];
  processingTimeMs: number;
}


// ── FAQ ───────────────────────────────────────────────────────────────────────

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaqCreateRequest {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
}


// ── Documents ─────────────────────────────────────────────────────────────────

export interface RagDocument {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'processing' | 'indexed' | 'error';
  chunkCount?: number;
  uploadedAt: Date;
  indexedAt?: Date;
}

export interface DocumentUploadResponse {
  id: string;
  filename: string;
  status: 'processing';
  message: string;
}
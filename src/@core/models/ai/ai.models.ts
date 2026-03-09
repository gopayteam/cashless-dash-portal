// ============================================================
// AI Services — Shared TypeScript Models
// ============================================================

// ── Chat ────────────────────────────────────────────────────
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
  message: string;
  useRag?: boolean;
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  intentDetected?: string;
  confidence?: number;
  sources?: RagSource[];
}

// ── RAG ─────────────────────────────────────────────────────
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

// ── Intents ─────────────────────────────────────────────────
export interface TrainingPhrase {
  id?: string;
  text: string;
}

export interface Intent {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  trainingPhrases: TrainingPhrase[];
  responses: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntentCreateRequest {
  name: string;
  displayName: string;
  description?: string;
  trainingPhrases: string[];
  responses: string[];
}

export interface IntentUpdateRequest extends Partial<IntentCreateRequest> {
  isActive?: boolean;
}

export interface ModelStatus {
  status: 'ready' | 'training' | 'error' | 'not_trained';
  accuracy?: number;
  totalIntents: number;
  totalPhrases: number;
  lastTrainedAt?: Date;
  trainingDurationMs?: number;
}

export interface RetrainResponse {
  jobId: string;
  status: 'queued' | 'running';
  message: string;
}

// ── FAQ / Documents ──────────────────────────────────────────
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

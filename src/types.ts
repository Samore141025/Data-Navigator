export type ColumnType = 'numeric' | 'categorical' | 'text' | 'datetime' | 'unknown';

export interface ColumnMetadata {
  name: string;
  type: ColumnType;
  distinctCount: number;
  nullCount: number;
  sampleValues: any[];
}

export interface DataStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
}

export interface ModelMetrics {
  name: string;
  r2?: number;
  mse?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  confusionMatrix?: number[][];
}

export interface TextAnalysisResult {
  tokens: string[];
  posTags: [string, string][];
  topTerms: { term: string; count: number; tfidf: number }[];
}

export interface ProcessingHistory {
  action: string;
  impact: string;
  timestamp: number;
}

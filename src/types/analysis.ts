export type ModalityType = 'text' | 'url' | 'image' | 'video' | 'document' | 'audio';

export type VerdictType = 'authentic' | 'suspicious' | 'fake';

export interface AnalysisResult {
  modality: ModalityType;
  verdict: VerdictType;
  confidence: number;
  explanation: string;
  details: {
    label: string;
    value: string;
    type?: 'positive' | 'negative' | 'neutral';
  }[];
  flags?: string[];
}

export interface MultimodalResult {
  overallVerdict: VerdictType;
  overallConfidence: number;
  fusionExplanation: string;
  modalities: AnalysisResult[];
}

export interface UploadedFile {
  file: File;
  preview?: string;
  type: ModalityType;
}

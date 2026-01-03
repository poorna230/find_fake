import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult, ModalityType, MultimodalResult, VerdictType } from '@/types/analysis';
import { toast } from 'sonner';

export function useContentAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [multimodalResult, setMultimodalResult] = useState<MultimodalResult | null>(null);

  const analyzeContent = async (
    type: ModalityType,
    content: string | File,
    base64Data?: string
  ) => {
    setIsLoading(true);

    try {
      let payload: Record<string, unknown> = { type };

      if (type === 'text' || type === 'url') {
        payload.content = content as string;
      } else if (type === 'image' && base64Data) {
        payload.imageBase64 = base64Data;
        payload.mimeType = (content as File).type;
      } else if (type === 'video' && content instanceof File) {
        // Extract frames from video client-side
        const frames = await extractVideoFrames(content);
        payload.videoFrames = frames;
      } else if (type === 'document' && content instanceof File) {
        // Read document as text or base64
        const docContent = await readFileAsBase64(content);
        payload.documentBase64 = docContent;
        payload.fileName = content.name;
        payload.mimeType = content.type;
      } else if (type === 'audio' && content instanceof File) {
        // Read audio as base64
        const audioContent = await readFileAsBase64(content);
        payload.audioBase64 = audioContent;
        payload.fileName = content.name;
        payload.mimeType = content.type;
      }

      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: payload,
      });

      if (error) throw error;

      const result: AnalysisResult = {
        modality: type,
        verdict: data.verdict as VerdictType,
        confidence: data.confidence,
        explanation: data.explanation,
        details: data.details || [],
        flags: data.flags || [],
      };

      setResults((prev) => [...prev, result]);

      // Update multimodal fusion
      updateMultimodalFusion([...results, result]);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} analysis complete`);
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMultimodalFusion = (allResults: AnalysisResult[]) => {
    if (allResults.length === 0) {
      setMultimodalResult(null);
      return;
    }

    // Weighted fusion based on modality reliability
    const weights: Record<ModalityType, number> = {
      text: 0.2,
      url: 0.15,
      image: 0.25,
      video: 0.2,
      document: 0.1,
      audio: 0.1,
    };

    let totalWeight = 0;
    let weightedScore = 0;
    let fakeCount = 0;
    let suspiciousCount = 0;

    allResults.forEach((r) => {
      const w = weights[r.modality];
      totalWeight += w;

      // Convert verdict to score: authentic=1, suspicious=0.5, fake=0
      const score = r.verdict === 'authentic' ? 1 : r.verdict === 'suspicious' ? 0.5 : 0;
      weightedScore += score * w * (r.confidence / 100);

      if (r.verdict === 'fake') fakeCount++;
      if (r.verdict === 'suspicious') suspiciousCount++;
    });

    const normalizedScore = weightedScore / totalWeight;
    const overallConfidence = Math.round(
      allResults.reduce((sum, r) => sum + r.confidence, 0) / allResults.length
    );

    let overallVerdict: VerdictType;
    let fusionExplanation: string;

    if (fakeCount > 0 || normalizedScore < 0.3) {
      overallVerdict = 'fake';
      fusionExplanation = `Multimodal analysis detected manipulation across ${allResults.length} modalities. ${fakeCount} modality/modalities flagged as fake with high confidence.`;
    } else if (suspiciousCount > 0 || normalizedScore < 0.7) {
      overallVerdict = 'suspicious';
      fusionExplanation = `Cross-modal analysis reveals inconsistencies across ${allResults.length} modalities. ${suspiciousCount} modality/modalities show suspicious patterns that warrant further investigation.`;
    } else {
      overallVerdict = 'authentic';
      fusionExplanation = `All ${allResults.length} analyzed modalities show consistent authentic patterns. No manipulation markers detected across text, visual, or audio content.`;
    }

    setMultimodalResult({
      overallVerdict,
      overallConfidence,
      fusionExplanation,
      modalities: allResults,
    });
  };

  const clearResults = () => {
    setResults([]);
    setMultimodalResult(null);
  };

  return {
    isLoading,
    results,
    multimodalResult,
    analyzeContent,
    clearResults,
  };
}

// Helper functions
async function extractVideoFrames(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];
      const duration = video.duration;
      const frameCount = Math.min(5, Math.floor(duration)); // Max 5 frames

      canvas.width = 640;
      canvas.height = 360;

      let currentFrame = 0;

      const captureFrame = () => {
        if (currentFrame >= frameCount) {
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }

        video.currentTime = (duration / frameCount) * currentFrame;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          frames.push(base64);
        }
        currentFrame++;
        captureFrame();
      };

      captureFrame();
    };

    video.onerror = () => {
      resolve([]);
    };
  });
}

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

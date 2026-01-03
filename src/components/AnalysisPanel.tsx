import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AnalysisResult, VerdictType } from '@/types/analysis';

interface AnalysisPanelProps {
  result: AnalysisResult;
}

const verdictConfig: Record<VerdictType, { icon: React.ReactNode; class: string; label: string }> = {
  authentic: {
    icon: <CheckCircle2 className="w-6 h-6" />,
    class: 'verdict-authentic',
    label: 'AUTHENTIC',
  },
  suspicious: {
    icon: <AlertTriangle className="w-6 h-6" />,
    class: 'verdict-suspicious',
    label: 'SUSPICIOUS',
  },
  fake: {
    icon: <XCircle className="w-6 h-6" />,
    class: 'verdict-fake',
    label: 'FAKE',
  },
};

const modalityLabels: Record<string, string> = {
  text: 'Text Analysis',
  url: 'URL Analysis',
  image: 'Image Analysis',
  video: 'Video Analysis',
  document: 'Document Analysis',
  audio: 'Audio Analysis',
};

export function AnalysisPanel({ result }: AnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = verdictConfig[result.verdict];

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-display font-medium text-foreground">
            {modalityLabels[result.modality]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5", config.class)}>
            {config.icon}
            {config.label}
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-white/5">
          {/* Confidence Meter */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="text-primary font-medium">{Math.round(result.confidence)}%</span>
            </div>
            <div className="confidence-meter">
              <div 
                className={cn(
                  "confidence-fill",
                  result.verdict === 'authentic' && "bg-success",
                  result.verdict === 'suspicious' && "bg-warning",
                  result.verdict === 'fake' && "bg-destructive"
                )}
                style={{ width: `${result.confidence}%` }}
              />
            </div>
          </div>

          {/* Explanation */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-sm text-foreground">{result.explanation}</p>
          </div>

          {/* Details */}
          {result.details.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Detection Details</h4>
              <div className="grid gap-2">
                {result.details.map((detail, idx) => (
                  <div 
                    key={idx}
                    className="flex justify-between items-center p-2 rounded bg-secondary/20"
                  >
                    <span className="text-sm text-muted-foreground">{detail.label}</span>
                    <span className={cn(
                      "text-sm font-medium",
                      detail.type === 'positive' && "text-success",
                      detail.type === 'negative' && "text-destructive",
                      detail.type === 'neutral' && "text-foreground"
                    )}>
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          {result.flags && result.flags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Detected Issues</h4>
              <div className="flex flex-wrap gap-2">
                {result.flags.map((flag, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 rounded text-xs bg-destructive/20 text-destructive border border-destructive/30"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

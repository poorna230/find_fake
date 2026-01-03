import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Layers,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MultimodalResult, VerdictType } from '@/types/analysis';

interface MultimodalFusionProps {
  result: MultimodalResult;
}

const verdictConfig: Record<VerdictType, { icon: React.ReactNode; bgClass: string; label: string }> = {
  authentic: {
    icon: <CheckCircle2 className="w-10 h-10" />,
    bgClass: 'from-success/20 to-success/5 border-success/50',
    label: 'AUTHENTIC',
  },
  suspicious: {
    icon: <AlertTriangle className="w-10 h-10" />,
    bgClass: 'from-warning/20 to-warning/5 border-warning/50',
    label: 'SUSPICIOUS',
  },
  fake: {
    icon: <XCircle className="w-10 h-10" />,
    bgClass: 'from-destructive/20 to-destructive/5 border-destructive/50',
    label: 'FAKE DETECTED',
  },
};

const modalityLabels: Record<string, string> = {
  text: 'Text',
  url: 'URL',
  image: 'Image',
  video: 'Video',
  document: 'Document',
  audio: 'Audio',
};

export function MultimodalFusion({ result }: MultimodalFusionProps) {
  const config = verdictConfig[result.overallVerdict];

  return (
    <div className="glass-card p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Brain className="w-6 h-6 text-accent" />
        <h3 className="font-display text-xl font-bold text-foreground">
          Multimodal Fusion Analysis
        </h3>
        <Layers className="w-5 h-5 text-primary ml-auto" />
      </div>

      {/* Overall Verdict */}
      <div className={cn(
        "p-6 rounded-xl border bg-gradient-to-br text-center",
        config.bgClass
      )}>
        <div className={cn(
          "inline-flex items-center justify-center mb-3",
          result.overallVerdict === 'authentic' && "text-success",
          result.overallVerdict === 'suspicious' && "text-warning",
          result.overallVerdict === 'fake' && "text-destructive"
        )}>
          {config.icon}
        </div>
        <h4 className="font-display text-2xl font-bold text-foreground mb-2">
          {config.label}
        </h4>
        <div className="flex items-center justify-center gap-2 text-lg">
          <span className="text-muted-foreground">Confidence:</span>
          <span className={cn(
            "font-bold",
            result.overallVerdict === 'authentic' && "text-success",
            result.overallVerdict === 'suspicious' && "text-warning",
            result.overallVerdict === 'fake' && "text-destructive"
          )}>
            {Math.round(result.overallConfidence)}%
          </span>
        </div>
      </div>

      {/* Fusion Explanation */}
      <div className="p-4 rounded-lg bg-secondary/30">
        <p className="text-foreground">{result.fusionExplanation}</p>
      </div>

      {/* Modality Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Modality Breakdown</h4>
        <div className="grid gap-2">
          {result.modalities.map((mod, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
            >
              <span className="font-medium text-foreground">
                {modalityLabels[mod.modality]}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {Math.round(mod.confidence)}%
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold uppercase",
                  mod.verdict === 'authentic' && "bg-success/20 text-success",
                  mod.verdict === 'suspicious' && "bg-warning/20 text-warning",
                  mod.verdict === 'fake' && "bg-destructive/20 text-destructive"
                )}>
                  {mod.verdict}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

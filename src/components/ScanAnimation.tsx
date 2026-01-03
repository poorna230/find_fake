import { cn } from '@/lib/utils';

interface ScanAnimationProps {
  isScanning: boolean;
  label?: string;
}

export function ScanAnimation({ isScanning, label = 'Analyzing content...' }: ScanAnimationProps) {
  if (!isScanning) return null;

  return (
    <div className="glass-card p-8 text-center space-y-6 animate-fade-in">
      {/* Animated scanner */}
      <div className="relative w-24 h-24 mx-auto">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
        
        {/* Middle ring */}
        <div className="absolute inset-2 rounded-full border-2 border-primary/50 animate-spin-slow" />
        
        {/* Inner circle */}
        <div className="absolute inset-4 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary animate-pulse-slow" />
        </div>

        {/* Scan line */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_linear_infinite]" />
        </div>
      </div>

      {/* Label */}
      <div className="space-y-2">
        <p className="font-display text-lg text-primary">{label}</p>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <span 
              key={i}
              className={cn(
                "w-2 h-2 rounded-full bg-primary",
                "animate-bounce"
              )}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

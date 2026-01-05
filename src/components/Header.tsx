import { Shield, Eye, Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="relative py-8 px-4 text-center overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <Shield className="w-12 h-12 text-primary animate-pulse-slow" />
            <Eye className="w-5 h-5 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text tracking-wider">
            FINDFAKE
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-6">
          Multimodal AI-Powered Fake Content Detection
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: <Zap className="w-4 h-4" />, label: 'Text' },
            { icon: <Zap className="w-4 h-4" />, label: 'URL' },
            { icon: <Zap className="w-4 h-4" />, label: 'Image' },
            { icon: <Zap className="w-4 h-4" />, label: 'Video' },
            { icon: <Zap className="w-4 h-4" />, label: 'Document' },
            { icon: <Zap className="w-4 h-4" />, label: 'Audio' },
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium"
            >
              {item.icon}
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scan, Globe, Trash2 } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onAnalyze, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (url.trim() && isValidUrl(url)) {
      onAnalyze(url);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="url"
          placeholder="https://example.com/article..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="pl-10 h-14 bg-secondary/30 border-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground text-lg"
        />
      </div>

      <div className="glass-card p-4 space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">URL Analysis includes:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Domain reputation & age verification
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Content credibility assessment
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Phishing & malware detection
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!url.trim() || !isValidUrl(url) || isLoading}
          className="flex-1"
          variant="glow"
          size="lg"
        >
          <Scan className="w-5 h-5" />
          {isLoading ? 'Analyzing...' : 'Analyze URL'}
        </Button>
        <Button
          onClick={() => setUrl('')}
          variant="outline"
          size="lg"
          disabled={!url}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

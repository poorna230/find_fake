import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Scan, Trash2 } from 'lucide-react';

interface TextInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

export function TextInput({ onAnalyze, isLoading }: TextInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onAnalyze(text);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          placeholder="Paste text content to analyze for misinformation, AI-generated content, or manipulation..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] bg-secondary/30 border-primary/20 focus:border-primary resize-none text-foreground placeholder:text-muted-foreground"
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          {text.length} characters
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="flex-1"
          variant="glow"
          size="lg"
        >
          <Scan className="w-5 h-5" />
          {isLoading ? 'Analyzing...' : 'Analyze Text'}
        </Button>
        <Button
          onClick={() => setText('')}
          variant="outline"
          size="lg"
          disabled={!text}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Header } from '@/components/Header';
import { ModalityTabs } from '@/components/ModalityTabs';
import { TextInput } from '@/components/TextInput';
import { UrlInput } from '@/components/UrlInput';
import { FileUpload } from '@/components/FileUpload';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { MultimodalFusion } from '@/components/MultimodalFusion';
import { ScanAnimation } from '@/components/ScanAnimation';
import { useContentAnalysis } from '@/hooks/useContentAnalysis';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { ModalityType } from '@/types/analysis';

const Index = () => {
  const [activeTab, setActiveTab] = useState<ModalityType>('text');
  const { isLoading, results, multimodalResult, analyzeContent, clearResults } = useContentAnalysis();

  const handleAnalyze = (content: string | File, base64?: string) => {
    analyzeContent(activeTab, content, base64);
  };

  return (
    <div className="min-h-screen tech-grid">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container max-w-5xl mx-auto px-4 py-8">
        <Header />

        {/* Main Content */}
        <main className="mt-8 space-y-8">
          {/* Modality Selection */}
          <section className="glass-card p-4">
            <ModalityTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </section>

          {/* Input Section */}
          <section className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Upload Content
              </h2>
              {results.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearResults}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Results
                </Button>
              )}
            </div>

            {activeTab === 'text' && (
              <TextInput onAnalyze={(text) => handleAnalyze(text)} isLoading={isLoading} />
            )}
            {activeTab === 'url' && (
              <UrlInput onAnalyze={(url) => handleAnalyze(url)} isLoading={isLoading} />
            )}
            {activeTab === 'image' && (
              <FileUpload 
                type="image" 
                onAnalyze={(file, base64) => handleAnalyze(file, base64)} 
                isLoading={isLoading} 
              />
            )}
            {activeTab === 'video' && (
              <FileUpload 
                type="video" 
                onAnalyze={(file) => handleAnalyze(file)} 
                isLoading={isLoading} 
              />
            )}
            {activeTab === 'document' && (
              <FileUpload 
                type="document" 
                onAnalyze={(file) => handleAnalyze(file)} 
                isLoading={isLoading} 
              />
            )}
            {activeTab === 'audio' && (
              <FileUpload 
                type="audio" 
                onAnalyze={(file) => handleAnalyze(file)} 
                isLoading={isLoading} 
              />
            )}
          </section>

          {/* Scanning Animation */}
          {isLoading && (
            <ScanAnimation isScanning={isLoading} />
          )}

          {/* Results Section */}
          {!isLoading && results.length > 0 && (
            <section className="space-y-6">
              {/* Multimodal Fusion - Show when 2+ modalities analyzed */}
              {multimodalResult && multimodalResult.modalities.length >= 1 && (
                <MultimodalFusion result={multimodalResult} />
              )}

              {/* Individual Analysis Panels */}
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Analysis Results
                </h2>
                <div className="grid gap-4">
                  {results.map((result, idx) => (
                    <AnalysisPanel key={idx} result={result} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && (
            <section className="glass-card p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Ready to Analyze
                </h3>
                <p className="text-muted-foreground">
                  Upload content using any of the 6 modalities above. Our AI will analyze it for
                  authenticity, manipulation, and misinformation.
                </p>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            FINDFAKE — Powered by Advanced Multimodal AI
          </p>
          <p className="mt-1 text-xs">
            Detects fake text, manipulated images, deepfake videos, fraudulent documents, and synthetic audio
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;

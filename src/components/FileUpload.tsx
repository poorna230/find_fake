import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  AudioLines,
  Scan 
} from 'lucide-react';
import type { ModalityType } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  type: ModalityType;
  onAnalyze: (file: File, base64?: string) => void;
  isLoading: boolean;
}

const typeConfig: Record<string, { accept: Record<string, string[]>; icon: React.ReactNode; label: string; maxSize: number }> = {
  image: {
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    icon: <ImageIcon className="w-12 h-12" />,
    label: 'image',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  video: {
    accept: { 'video/*': ['.mp4', '.webm', '.mov', '.avi'] },
    icon: <Video className="w-12 h-12" />,
    label: 'video',
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  document: {
    accept: { 
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    icon: <FileText className="w-12 h-12" />,
    label: 'document',
    maxSize: 20 * 1024 * 1024, // 20MB
  },
  audio: {
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac'] },
    icon: <AudioLines className="w-12 h-12" />,
    label: 'audio',
    maxSize: 50 * 1024 * 1024, // 50MB
  },
};

export function FileUpload({ type, onAnalyze, isLoading }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const config = typeConfig[type];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);

      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(uploadedFile);
      } else if (type === 'video') {
        setPreview(URL.createObjectURL(uploadedFile));
      } else if (type === 'audio') {
        setPreview(URL.createObjectURL(uploadedFile));
      }
    }
  }, [type]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: config.accept,
    maxSize: config.maxSize,
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!file) return;

    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        onAnalyze(file, base64);
      };
      reader.readAsDataURL(file);
    } else {
      onAnalyze(file);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "upload-zone rounded-xl p-8 text-center cursor-pointer transition-all duration-300",
            isDragActive && "drag-over"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="text-primary/60">
              {config.icon}
            </div>
            <div>
              <p className="text-lg font-medium text-foreground mb-1">
                {isDragActive ? `Drop your ${config.label} here` : `Drag & drop ${config.label} file`}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse • Max {Math.round(config.maxSize / 1024 / 1024)}MB
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Select File
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-primary">
                {config.icon}
              </div>
              <div>
                <p className="font-medium text-foreground truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Preview */}
          {preview && type === 'image' && (
            <div className="rounded-lg overflow-hidden border border-primary/20">
              <img src={preview} alt="Preview" className="w-full max-h-64 object-contain bg-black/50" />
            </div>
          )}
          {preview && type === 'video' && (
            <div className="rounded-lg overflow-hidden border border-primary/20">
              <video src={preview} controls className="w-full max-h-64" />
            </div>
          )}
          {preview && type === 'audio' && (
            <div className="rounded-lg p-4 bg-secondary/30 border border-primary/20">
              <audio src={preview} controls className="w-full" />
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleAnalyze}
        disabled={!file || isLoading}
        className="w-full"
        variant="glow"
        size="lg"
      >
        <Scan className="w-5 h-5" />
        {isLoading ? 'Analyzing...' : `Analyze ${config.label.charAt(0).toUpperCase() + config.label.slice(1)}`}
      </Button>
    </div>
  );
}

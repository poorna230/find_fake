import { 
  FileText, 
  Link, 
  Image, 
  Video, 
  FileSearch, 
  AudioLines 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModalityType } from '@/types/analysis';

interface ModalityTabsProps {
  activeTab: ModalityType;
  onTabChange: (tab: ModalityType) => void;
}

const tabs: { id: ModalityType; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Text', icon: <FileText className="w-5 h-5" /> },
  { id: 'url', label: 'URL', icon: <Link className="w-5 h-5" /> },
  { id: 'image', label: 'Image', icon: <Image className="w-5 h-5" /> },
  { id: 'video', label: 'Video', icon: <Video className="w-5 h-5" /> },
  { id: 'document', label: 'Document', icon: <FileSearch className="w-5 h-5" /> },
  { id: 'audio', label: 'Audio', icon: <AudioLines className="w-5 h-5" /> },
];

export function ModalityTabs({ activeTab, onTabChange }: ModalityTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 p-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(185,100%,50%,0.4)]"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

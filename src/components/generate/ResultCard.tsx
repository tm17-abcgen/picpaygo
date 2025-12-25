import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultCardProps {
  imageUrl: string;
  onGenerateAnother: () => void;
  onDownload?: () => void;
}

export function ResultCard({ imageUrl, onGenerateAnother, onDownload }: ResultCardProps) {
  const handleDownload = () => {
    // Trigger download for guests and logged-in users
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-portrait-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onDownload?.();
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square max-w-sm mx-auto rounded-lg overflow-hidden bg-secondary">
        <img
          src={imageUrl}
          alt="Generated AI portrait"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex gap-3 max-w-sm mx-auto">
        <Button onClick={handleDownload} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        
        <Button
          onClick={onGenerateAnother}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>
    </div>
  );
}

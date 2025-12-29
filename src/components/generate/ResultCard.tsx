import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultCardProps {
  imageUrl: string;
  onGenerateAnother: () => void;
  onDownload?: () => void;
}

export function ResultCard({ imageUrl, onGenerateAnother, onDownload }: ResultCardProps) {
  const handleDownload = () => {
    onDownload?.();
    const url = new URL(imageUrl, window.location.origin);
    url.searchParams.set('download', '1');
    const a = document.createElement('a');
    a.href = url.toString();
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square max-w-sm mx-auto rounded-lg overflow-hidden bg-secondary">
        <img
          src={imageUrl}
          alt="Generated image"
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

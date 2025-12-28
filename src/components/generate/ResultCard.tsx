import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultCardProps {
  imageUrl: string;
  onGenerateAnother: () => void;
  onDownload?: () => void;
}

export function ResultCard({ imageUrl, onGenerateAnother, onDownload }: ResultCardProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `picpaygo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to direct link if fetch fails
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `picpaygo-${Date.now()}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    onDownload?.();
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

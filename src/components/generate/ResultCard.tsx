import { Download, RefreshCw, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCredits } from '@/context/CreditsContext';

interface ResultCardProps {
  imageUrl: string;
  onGenerateAnother: () => void;
  onDownload: () => void;
}

export function ResultCard({ imageUrl, onGenerateAnother, onDownload }: ResultCardProps) {
  const { isLoggedIn } = useCredits();

  const handleDownload = () => {
    if (!isLoggedIn) {
      // This will be handled by the parent to show login prompt
      onDownload();
      return;
    }
    
    // Trigger download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-portrait-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <Button
          onClick={handleDownload}
          className="flex-1"
          variant={isLoggedIn ? 'default' : 'outline'}
        >
          {isLoggedIn ? (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Login to Download
            </>
          )}
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

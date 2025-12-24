import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { UploadPanel } from '@/components/generate/UploadPanel';
import { CategoryPicker, Category } from '@/components/generate/CategoryPicker';
import { GenerationStatus, Status } from '@/components/generate/GenerationStatus';
import { ResultCard } from '@/components/generate/ResultCard';
import { LoginPrompt } from '@/components/generate/LoginPrompt';
import { BuyCreditsModal } from '@/components/credits/BuyCreditsModal';
import { useCredits } from '@/context/CreditsContext';
import { generateImage, getGenerationStatus } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function Generate() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('portraits');
  const [status, setStatus] = useState<Status>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { credits, isLoggedIn, refreshCredits } = useCredits();
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setStatus('idle');
    setError(null);
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setStatus('idle');
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    
    if (credits < 1) {
      setShowBuyModal(true);
      return;
    }
    
    setStatus('uploading');
    setError(null);
    
    try {
      const result = await generateImage(selectedFile, category);
      setJobId(result.jobId);
      setStatus('queued');
      await refreshCredits();
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Generation failed');
      toast({
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  // Poll for generation status
  const pollStatus = useCallback(async () => {
    if (!jobId || status === 'completed' || status === 'failed') return;
    
    try {
      const generation = await getGenerationStatus(jobId);
      if (generation) {
        if (generation.status === 'completed') {
          setStatus('completed');
          setResultUrl(generation.outputUrl);
        } else if (generation.status === 'failed') {
          setStatus('failed');
          setError('Generation failed. Please try again.');
        } else {
          setStatus(generation.status as Status);
        }
      }
    } catch (err) {
      console.error('Failed to poll status:', err);
    }
  }, [jobId, status]);

  useEffect(() => {
    if (jobId && status !== 'completed' && status !== 'failed' && status !== 'idle') {
      const interval = setInterval(pollStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [jobId, status, pollStatus]);

  const handleGenerateAnother = () => {
    handleClear();
    setJobId(null);
  };

  const handleDownload = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
    }
  };

  const isGenerating = status === 'uploading' || status === 'queued' || status === 'processing';

  return (
    <Layout fullPage>
      <SEO
        title="Generate AI Portrait"
        description="Upload your photo and create a stunning professional portrait with AI"
      />
      
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Generate Your Portrait
          </h1>
          <p className="text-muted-foreground">
            Upload a photo, choose a style, and let AI create magic.
          </p>
        </div>

        <div className="space-y-6">
          {/* Result display */}
          {resultUrl && status === 'completed' ? (
            <div className="space-y-6">
              <ResultCard
                imageUrl={resultUrl}
                onGenerateAnother={handleGenerateAnother}
                onDownload={handleDownload}
              />
              
              {showLoginPrompt && !isLoggedIn && (
                <LoginPrompt onSuccess={() => setShowLoginPrompt(false)} />
              )}
            </div>
          ) : (
            <>
              {/* Upload panel */}
              <UploadPanel
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                onClear={handleClear}
                disabled={isGenerating}
              />

              {/* Category picker */}
              {selectedFile && (
                <CategoryPicker
                  selected={category}
                  onChange={setCategory}
                  disabled={isGenerating}
                />
              )}

              {/* Status display */}
              <GenerationStatus status={status} error={error || undefined} />

              {/* Generate button */}
              {selectedFile && status !== 'completed' && (
                <div className="space-y-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || credits < 1}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate (1 credit)
                      </>
                    )}
                  </Button>
                  
                  {credits < 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowBuyModal(true)}
                      className="w-full"
                    >
                      Buy Credits to Continue
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Instructions link */}
          <div className="text-center">
            <Link
              to="/instructions"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Tips for best results
            </Link>
          </div>
        </div>
      </div>
      
      <BuyCreditsModal open={showBuyModal} onOpenChange={setShowBuyModal} />
    </Layout>
  );
}

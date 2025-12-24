import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  Camera,
  Sun,
  User,
  Circle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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

const tips = [
  {
    icon: Camera,
    title: 'Good lighting',
    description: 'Natural daylight or even indoor lighting. Avoid harsh shadows.',
  },
  {
    icon: Sun,
    title: 'Neutral background',
    description: 'A simple, uncluttered background helps AI focus on you.',
  },
  {
    icon: User,
    title: 'Face the camera',
    description: 'Look directly at the camera with your face clearly visible.',
  },
  {
    icon: Circle,
    title: 'Remove accessories',
    description: 'Take off hats or sunglasses for best results.',
  },
];

const steps = [
  {
    title: 'Upload a portrait',
    description: 'Choose a clear photo with soft light and a neutral background.',
  },
  {
    title: 'Pick a category',
    description: 'Select Portrait, Editorial, Fashion, or Vogue Italia styling.',
  },
  {
    title: 'Generate and download',
    description: 'We deliver a refined result that still looks like you.',
  },
];

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
  const [showTips, setShowTips] = useState(false);
  
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
    <Layout>
      <SEO
        title="Generate Portraits | PicPayGo"
        description="PicPayGo turns your photo into professional portraits, editorial looks, and fashion-ready imagery."
      />
      
      <div className="max-w-3xl mx-auto py-4 sm:py-6 px-4 space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            PicPayGo Studio
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Generate your portrait in minutes
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Upload a photo, choose a category, and receive a refined, professional result.
          </p>
        </div>

        <div className="rounded-[28px] border border-border bg-card/60 p-6 sm:p-7 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            How it works
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 max-w-2xl mx-auto">
          {/* Result display */}
          {resultUrl && status === 'completed' ? (
            <div className="space-y-5">
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

          {/* Collapsible Tips section */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">Tips for best results</span>
              {showTips ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            
            {showTips && (
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tips.map((tip) => (
                  <div
                    key={tip.title}
                    className="flex gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <tip.icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <BuyCreditsModal open={showBuyModal} onOpenChange={setShowBuyModal} />
    </Layout>
  );
}

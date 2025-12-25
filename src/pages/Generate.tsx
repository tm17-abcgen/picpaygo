import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  Camera,
  Sun,
  User,
  Circle,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { UploadPanel } from '@/components/generate/UploadPanel';
import { CategoryPicker, Category } from '@/components/generate/CategoryPicker';
import { GenerationStatus, Status } from '@/components/generate/GenerationStatus';
import { GenerationPreview } from '@/components/generate/GenerationPreview';
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
    description: 'Soft light, neutral background.',
  },
  {
    title: 'Pick a category',
    description: 'Portrait, Editorial, Fashion, or Vogue Italia.',
  },
  {
    title: 'Generate and download',
    description: 'A refined result that still looks like you.',
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
      if (isLoggedIn) {
        setShowBuyModal(true);
      } else {
        setShowLoginPrompt(true);
      }
      return;
    }
    
    setStatus('uploading');
    setError(null);
    
    try {
      const result = await generateImage(selectedFile, category, isLoggedIn);
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
          setResultUrl(generation.outputUrl || null);
        } else if (generation.status === 'failed') {
          setStatus('failed');
          setResultUrl(null);
          setError(generation.error || 'Generation failed. Please try again.');
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
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `ai-portrait-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isGenerating = status === 'uploading' || status === 'queued' || status === 'processing';
  const showTransformation = !!selectedFile && !!previewUrl && (isGenerating || status === 'completed');
  const previewSource = previewUrl ?? '';

  return (
    <Layout>
      <SEO
        title="Generate Portraits | PicPayGo"
        description="PicPayGo turns your photo into professional portraits, editorial looks, and fashion-ready imagery."
      />
      
      <div className="max-w-3xl mx-auto py-4 sm:py-6 px-4 space-y-6">
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

        <div className="border-y border-border/60 py-5">
          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground text-center mb-5">
            How it works
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Result display */}
          {showTransformation ? (
            <div className="space-y-6">
              <GenerationPreview
                inputUrl={previewSource}
                outputUrl={resultUrl}
                status={status}
                category={category}
              />

              {status === 'completed' && resultUrl && (
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  <Button onClick={handleGenerateAnother} variant="outline" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </div>
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
                      onClick={() => (isLoggedIn ? setShowBuyModal(true) : setShowLoginPrompt(true))}
                      className="w-full"
                    >
                      {isLoggedIn ? 'Buy Credits to Continue' : 'Login to Buy Credits'}
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

          {showLoginPrompt && !isLoggedIn && (
            <LoginPrompt onSuccess={() => setShowLoginPrompt(false)} />
          )}
        </div>
      </div>
      
      <BuyCreditsModal open={showBuyModal} onOpenChange={setShowBuyModal} />
    </Layout>
  );
}

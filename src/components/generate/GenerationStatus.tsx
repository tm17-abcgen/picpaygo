import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { GenerationCategory } from '@/types/generation';

export type Status = 'idle' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';

interface GenerationStatusProps {
  status: Status;
  category?: GenerationCategory | null;
  error?: string;
}

const PORTRAIT_CATEGORIES: GenerationCategory[] = [
  'professional-headshot',
  'business-portrait',
  '90s-point-and-shoot',
  'canon-ixus-aesthetic',
  'left-profile',
  'right-profile',
];

const SELFIE_CATEGORIES: GenerationCategory[] = [
  'mirror-selfie-2000s',
  'bathroom-mirror-selfie',
];

const FASHION_CATEGORIES: GenerationCategory[] = [
  'victorias-secret-shoot',
  'studio-vogue-editorial',
];

const FILM_CATEGORIES: GenerationCategory[] = ['emotional-film'];

function getProcessingMessage(category: GenerationCategory | null | undefined): string {
  if (!category) return 'Creating your image...';

  if (PORTRAIT_CATEGORIES.includes(category)) return 'Creating your portrait...';
  if (SELFIE_CATEGORIES.includes(category)) return 'Creating your selfie...';
  if (FASHION_CATEGORIES.includes(category)) return 'Creating your editorial look...';
  if (FILM_CATEGORIES.includes(category)) return 'Capturing the mood...';

  // Enhancement-specific messages
  if (category === 'crowd-removal') return 'Removing the crowd...';
  if (category === 'upscaling') return 'Upscaling your image...';
  if (category === 'restoration') return 'Restoring your photo...';

  return 'Creating your image...';
}

function getCompletedMessage(category: GenerationCategory | null | undefined): string {
  if (!category) return 'Your image is ready!';

  // Enhancement-specific completion messages
  if (category === 'crowd-removal') return 'Crowd removed!';
  if (category === 'upscaling') return 'Upscaling complete!';
  if (category === 'restoration') return 'Restoration complete!';

  return 'Your image is ready!';
}

export function GenerationStatus({ status, category, error }: GenerationStatusProps) {
  if (status === 'idle') return null;

  const processingMessage = getProcessingMessage(category);
  const completedMessage = getCompletedMessage(category);

  const statusConfig: Record<Status, { icon: React.ReactNode; label: string; description: string }> = {
    idle: {
      icon: null,
      label: '',
      description: '',
    },
    uploading: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-accent" />,
      label: 'Uploading',
      description: 'Sending your photo to our servers...',
    },
    queued: {
      icon: <Clock className="h-5 w-5 text-muted-foreground" />,
      label: 'Queued',
      description: 'Your request is in the queue...',
    },
    processing: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-accent" />,
      label: 'Processing',
      description: processingMessage,
    },
    completed: {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      label: 'Complete',
      description: completedMessage,
    },
    failed: {
      icon: <XCircle className="h-5 w-5 text-destructive" />,
      label: 'Failed',
      description: 'Something went wrong. Please try again.',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
      {config.icon}
      <div>
        <p className="font-medium text-foreground">{config.label}</p>
        <p className="text-sm text-muted-foreground">
          {error || config.description}
        </p>
      </div>
    </div>
  );
}

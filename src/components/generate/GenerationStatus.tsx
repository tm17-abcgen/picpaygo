import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

export type Status = 'idle' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';

interface GenerationStatusProps {
  status: Status;
  error?: string;
}

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
    description: 'Our AI is creating your portrait...',
  },
  completed: {
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    label: 'Complete',
    description: 'Your portrait is ready!',
  },
  failed: {
    icon: <XCircle className="h-5 w-5 text-destructive" />,
    label: 'Failed',
    description: 'Something went wrong. Please try again.',
  },
};

export function GenerationStatus({ status, error }: GenerationStatusProps) {
  if (status === 'idle') return null;

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

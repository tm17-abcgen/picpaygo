import type { Status } from '@/components/generate/GenerationStatus';
import type { GenerationCategory } from '@/types/generation';
import { CATEGORY_LABELS } from '@/types/generation';

interface GenerationPreviewProps {
  inputUrl: string;
  outputUrl: string | null;
  status: Status;
  category: GenerationCategory;
}

const statusCopy: Record<Status, { label: string; detail: string }> = {
  idle: { label: '', detail: '' },
  uploading: { label: 'Uploading', detail: 'Securing your negative in the lab.' },
  queued: { label: 'Queued', detail: 'Waiting for an open darkroom bay.' },
  processing: { label: 'Developing', detail: 'Shaping light, tone, and texture.' },
  completed: { label: 'Ready', detail: 'Your portrait is ready to download.' },
  failed: { label: 'Failed', detail: 'Something went wrong. Please try again.' },
};

const statusDot: Record<Status, string> = {
  idle: 'bg-muted-foreground/40',
  uploading: 'bg-amber-400',
  queued: 'bg-muted-foreground/70',
  processing: 'bg-accent',
  completed: 'bg-emerald-500',
  failed: 'bg-destructive',
};

export function GenerationPreview({ inputUrl, outputUrl, status, category }: GenerationPreviewProps) {
  const isGenerating = status === 'uploading' || status === 'queued' || status === 'processing';
  const showOutput = status === 'completed' && !!outputUrl;
  const meta = statusCopy[status];
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${statusDot[status]} ${isGenerating ? 'animate-pulse' : ''}`} />
          <span>{meta.label}</span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {categoryLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{meta.detail}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grain-panel relative aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-border/60 bg-card/70 shadow-sm">
          <img
            src={inputUrl}
            alt="Original upload"
            className="h-full w-full object-cover"
          />
          {isGenerating && <div className="photolab-scan" aria-hidden="true" />}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent px-4 pb-4 pt-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/85">Original</p>
            <p className="text-xs text-white/70 mt-1">Input portrait</p>
          </div>
        </div>

        <div className="grain-panel relative aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-border/60 bg-gradient-to-br from-background via-secondary/40 to-secondary/10 shadow-sm">
          <img
            src={inputUrl}
            alt="Developing preview"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              showOutput ? 'opacity-0' : 'opacity-100 photolab-develop'
            }`}
          />
          <div
            className={`photolab-shimmer absolute inset-0 transition-opacity duration-700 ${
              showOutput ? 'opacity-0' : 'opacity-100'
            }`}
            aria-hidden="true"
          />
          {outputUrl && (
            <img
              src={outputUrl}
              alt="Generated portrait"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                showOutput ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-4 pb-4 pt-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/85">
              {showOutput ? 'Generated' : 'Developing'}
            </p>
            <p className="text-xs text-white/70 mt-1">
              {showOutput ? 'Final render' : 'Refining exposure and texture'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

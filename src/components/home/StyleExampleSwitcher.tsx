import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ExampleCategory = 'portraits' | 'selfies' | 'fashion' | 'film';

interface ExampleStyle {
  id: ExampleCategory;
  label: string;
  before: { src: string; alt: string; caption: string };
  after: { src: string; alt: string; caption: string };
}

const exampleStyles: ExampleStyle[] = [
  {
    id: 'portraits',
    label: 'Portraits',
    before: {
      src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=75',
      alt: 'Portrait before transformation',
      caption: 'Original',
    },
    after: {
      src: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=75',
      alt: 'Portrait after transformation',
      caption: 'PicPayGo result',
    },
  },
  {
    id: 'selfies',
    label: 'Selfies',
    before: {
      src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=75',
      alt: 'Selfie before transformation',
      caption: 'Original',
    },
    after: {
      src: 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651?auto=format&fit=crop&w=900&q=75',
      alt: 'Selfie after transformation',
      caption: 'PicPayGo result',
    },
  },
  {
    id: 'fashion',
    label: 'Fashion / Editorial',
    before: {
      src: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=900&q=75',
      alt: 'Fashion before transformation',
      caption: 'Original',
    },
    after: {
      src: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=75',
      alt: 'Fashion after transformation',
      caption: 'PicPayGo result',
    },
  },
  {
    id: 'film',
    label: 'Film / Mood',
    before: {
      src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=75',
      alt: 'Film before transformation',
      caption: 'Original',
    },
    after: {
      src: 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=900&q=75',
      alt: 'Film after transformation',
      caption: 'PicPayGo result',
    },
  },
];

const exampleImageMotion = {
  initial: { opacity: 0, scale: 1.01 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.99 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

export function StyleExampleSwitcher() {
  const [activeId, setActiveId] = useState<ExampleCategory>('portraits');
  const activeStyle = exampleStyles.find((style) => style.id === activeId) ?? exampleStyles[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed">
        <p>
          PicPayGo preserves identity while enhancing lighting, styling, and composition. Use it for
          CV headshots, personal branding, or editorial looks without a full shoot.
        </p>
      </div>

      <div className="grain-panel editorial-grid rounded-[36px] border border-border/50 bg-card/40 p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.9fr_1.05fr] lg:items-center">
          <div>
            <div className="relative aspect-[3/4] w-full rounded-[28px] overflow-hidden border border-border/70 bg-background">
              <AnimatePresence mode="sync" initial={false}>
                <motion.img
                  key={`${activeStyle.id}-before`}
                  src={activeStyle.before.src}
                  alt={activeStyle.before.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={exampleImageMotion.initial}
                  animate={exampleImageMotion.animate}
                  exit={exampleImageMotion.exit}
                  transition={exampleImageMotion.transition}
                />
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/55 to-transparent p-4">
                <p className="text-[10px] uppercase tracking-[0.35em] text-white">{activeStyle.before.caption}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="h-px w-10 bg-border/60" />
              <ArrowRight className="h-4 w-4" />
              <div className="h-px w-10 bg-border/60" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Choose a category
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {exampleStyles.map((style) => {
                const isActive = style.id === activeId;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setActiveId(style.id)}
                    className={cn(
                      'px-1 pb-1 text-[10px] uppercase tracking-[0.34em] transition-colors border-b',
                      isActive
                        ? 'border-foreground/80 text-foreground'
                        : 'border-transparent text-muted-foreground/70 hover:text-foreground hover:border-foreground/40'
                    )}
                    aria-pressed={isActive}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
            <div className="h-px w-20 bg-border/50" />
          </div>

            <div>
              <div className="relative aspect-[3/4] w-full rounded-[28px] overflow-hidden border border-border/70 bg-background">
                <AnimatePresence mode="sync" initial={false}>
                  <motion.img
                    key={`${activeStyle.id}-after`}
                    src={activeStyle.after.src}
                    alt={activeStyle.after.alt}
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={exampleImageMotion.initial}
                    animate={exampleImageMotion.animate}
                    exit={exampleImageMotion.exit}
                    transition={exampleImageMotion.transition}
                  />
                </AnimatePresence>
                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/55 to-transparent p-4">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white">{activeStyle.after.caption}</p>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

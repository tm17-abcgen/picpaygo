import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonHandle } from './ComparisonHandle';

interface BeforeAfterSliderProps {
  beforeImage: { src: string; alt: string };
  afterImage: { src: string; alt: string };
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number;
  className?: string;
  toolTitle: string;
  description: string;
  to: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Original',
  afterLabel = 'Enhanced',
  initialPosition = 50,
  className,
  toolTitle,
  description,
  to,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const reduceMotion = useReducedMotion();

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  }, [isDragging, updatePosition]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setPosition(prev => Math.max(0, prev - 5));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setPosition(prev => Math.min(100, prev + 5));
        break;
      case 'Home':
        e.preventDefault();
        setPosition(0);
        break;
      case 'End':
        e.preventDefault();
        setPosition(100);
        break;
    }
  }, []);

  return (
    <motion.div
      className={cn('w-full h-full', className)}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={reduceMotion ? undefined : { type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="rounded-[1.75rem] bg-secondary/30 shadow-sm ring-1 ring-border/60 overflow-hidden h-full flex flex-col">
        {/* Slider container */}
        <div
          ref={containerRef}
          className="relative aspect-[4/3] select-none touch-none overflow-hidden flex-shrink-0"
          role="slider"
          aria-valuenow={Math.round(position)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Compare ${beforeLabel} and ${afterLabel} images for ${toolTitle}. Currently showing ${Math.round(position)}% original.`}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          {/* After image (full, sits behind) */}
          <img
            src={afterImage.src}
            alt={afterImage.alt}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Before image (clipped to reveal after) */}
          <img
            src={beforeImage.src}
            alt={beforeImage.alt}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            draggable={false}
          />

          {/* Labels */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {beforeLabel}
            </span>
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {afterLabel}
            </span>
          </div>

          {/* Divider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-sm pointer-events-none"
            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
          />

          {/* Handle */}
          <div
            className="absolute top-1/2 pointer-events-none"
            style={{ left: `${position}%`, transform: 'translate(-50%, -50%)' }}
          >
            <ComparisonHandle isDragging={isDragging} />
          </div>
        </div>

        {/* Tool info and CTA */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-base font-semibold text-foreground mb-1.5">
            {toolTitle}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
            {description}
          </p>
          <Link
            to={to}
            className="inline-flex items-center text-sm font-medium text-accent hover:gap-2 transition-all group"
          >
            Try this tool
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

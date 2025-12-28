import { MoveHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonHandleProps {
  isDragging: boolean;
  className?: string;
}

export function ComparisonHandle({ isDragging, className }: ComparisonHandleProps) {
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full bg-accent flex items-center justify-center',
        'shadow-md cursor-grab transition-transform',
        isDragging && 'cursor-grabbing scale-110',
        className
      )}
    >
      <MoveHorizontal className="w-5 h-5 text-white" />
    </div>
  );
}

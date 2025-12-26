import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ServiceCardProps = {
  title: string;
  description: string;
  to: string;
  icon?: React.ReactNode;
  className?: string;
};

export function ServiceCard({ title, description, to, icon, className }: ServiceCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn('w-full h-full', className)}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={reduceMotion ? undefined : { type: 'spring', stiffness: 260, damping: 22 }}
    >
      <Link
        to={to}
        className="group flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[1.75rem]"
      >
        <div className="rounded-[1.75rem] bg-secondary/30 shadow-sm ring-1 ring-border/60 overflow-hidden h-full">
          <div className="p-6 h-full flex flex-col">
            {/* Icon placeholder */}
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 text-accent">
              {icon || <SparklesIcon />}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
              {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
              {description}
            </p>

            {/* CTA */}
            <div className="flex items-center text-sm font-medium text-accent group-hover:gap-2 transition-all">
              Use this tool
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

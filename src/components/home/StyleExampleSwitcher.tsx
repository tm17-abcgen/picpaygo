import { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExampleStyle {
  id: string;
  label: string;
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
}

const exampleStyles: ExampleStyle[] = [
  {
    id: 'portrait',
    label: 'Portrait',
    beforeImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
    afterImage: 'https://images.pexels.com/photos/19456424/pexels-photo-19456424.jpeg?auto=compress&cs=tinysrgb&w=600',
    beforeAlt: 'Original casual selfie',
    afterAlt: 'Professional portrait transformation',
  },
  {
    id: 'fashion',
    label: 'Fashion',
    beforeImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
    afterImage: 'https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&cs=tinysrgb&w=600',
    beforeAlt: 'Original outdoor photo',
    afterAlt: 'Fashion editorial style',
  },
  {
    id: 'vogue',
    label: 'Vogue Italia',
    beforeImage: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=600',
    afterImage: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=600',
    beforeAlt: 'Original headshot',
    afterAlt: 'Vogue Italia editorial style',
  },
  {
    id: 'documentary',
    label: 'Documentary',
    beforeImage: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=600',
    afterImage: 'https://images.pexels.com/photos/10351047/pexels-photo-10351047.jpeg?auto=compress&cs=tinysrgb&w=600',
    beforeAlt: 'Original photo',
    afterAlt: 'Documentary style portrait',
  },
];

export function StyleExampleSwitcher() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStyle = exampleStyles[activeIndex];

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % exampleStyles.length);
  };

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + exampleStyles.length) % exampleStyles.length);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Style selector tabs */}
      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        {exampleStyles.map((style, index) => (
          <button
            key={style.id}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'px-4 py-2 text-sm rounded-full border transition-all duration-200',
              index === activeIndex
                ? 'bg-foreground text-background border-foreground'
                : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground'
            )}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Before/After display */}
      <div className="relative">
        {/* Mobile: Stack vertically */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Before image */}
          <div className="relative flex-1 max-w-[240px] sm:max-w-[280px]">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
              <img
                src={activeStyle.beforeImage}
                alt={activeStyle.beforeAlt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="absolute bottom-2 left-2 px-2 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm rounded text-foreground">
              Before
            </span>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-foreground rotate-90 sm:rotate-0" />
            </div>
          </div>

          {/* After image */}
          <div className="relative flex-1 max-w-[240px] sm:max-w-[280px]">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary shadow-lg">
              <img
                src={activeStyle.afterImage}
                alt={activeStyle.afterAlt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="absolute bottom-2 left-2 px-2 py-1 text-xs font-medium bg-foreground text-background rounded">
              {activeStyle.label}
            </span>
          </div>
        </div>

        {/* Navigation arrows for mobile */}
        <div className="flex sm:hidden items-center justify-center gap-4 mt-4">
          <button
            onClick={goPrev}
            className="p-2 rounded-full border border-border hover:bg-secondary transition-colors"
            aria-label="Previous style"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-muted-foreground">
            {activeIndex + 1} / {exampleStyles.length}
          </span>
          <button
            onClick={goNext}
            className="p-2 rounded-full border border-border hover:bg-secondary transition-colors"
            aria-label="Next style"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

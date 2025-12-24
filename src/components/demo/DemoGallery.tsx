import { usePortfolio } from '@/context/PortfolioContext';

interface DemoImage {
  id: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  caption?: {
    subject?: string;
    description?: string;
  };
}

export function DemoGallery() {
  const { getSeriesBySlug } = usePortfolio();
  const demoSeries = getSeriesBySlug('demo');

  if (!demoSeries) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No demo images available.</p>
      </div>
    );
  }

  // Parse demo images - expecting before/after pairs in the images array
  const demoPairs: DemoImage[] = [];
  const images = demoSeries.images;
  
  for (let i = 0; i < images.length; i += 2) {
    if (images[i] && images[i + 1]) {
      demoPairs.push({
        id: images[i].id,
        beforeSrc: images[i].src,
        afterSrc: images[i + 1].src,
        beforeAlt: images[i].alt || 'Before image',
        afterAlt: images[i + 1].alt || 'After image',
        caption: images[i].caption,
      });
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-2">Before & After</h2>
        <p className="text-muted-foreground">
          See what our AI can do. Upload any photo and get a professional portrait.
        </p>
      </div>
      
      <div className="grid gap-8 md:gap-12">
        {demoPairs.map((pair) => (
          <div key={pair.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before */}
              <div className="space-y-2">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={pair.beforeSrc}
                    alt={pair.beforeAlt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">Before</p>
              </div>
              
              {/* After */}
              <div className="space-y-2">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={pair.afterSrc}
                    alt={pair.afterAlt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">After</p>
              </div>
            </div>
            
            {pair.caption?.subject && (
              <p className="text-center font-medium text-foreground">
                {pair.caption.subject}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

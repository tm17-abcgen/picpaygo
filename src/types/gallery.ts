export interface GalleryImage {
  id: string;
  src: string;
  srcSet?: string;
  alt: string;
  aspectRatio: number;
  caption: {
    subject: string;
    profession: string;
  };
  metadata: {
    title: string;
    year: string;
    description?: string;
    location?: string;
    camera?: string;
    series: string;
  };
}

export interface PortfolioSeries {
  id: string;
  title: string;
  slug: string;
  description: string;
  images: GalleryImage[];
  featured: boolean;
  parentSlug?: string;
  children?: {
    slug: string;
    title: string;
    description?: string;
  }[];
}

export interface FilmstripGalleryProps {
  images: GalleryImage[];
  className?: string;
  autoAdvance?: boolean;
  autoAdvanceInterval?: number;
}

export interface GalleryControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  currentIndex: number;
  totalImages: number;
  className?: string;
}

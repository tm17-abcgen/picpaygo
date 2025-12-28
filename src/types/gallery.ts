export interface BeforeAfterPair {
  id: string;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  caption?: string;
}

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

export interface SeriesChild {
  slug: string;
  title: string;
  description?: string;
  images: GalleryImage[];
  beforeAfterExamples?: BeforeAfterPair[];
}

export interface PortfolioSeries {
  id: string;
  title: string;
  slug: string;
  description: string;
  images?: GalleryImage[];
  featured: boolean;
  isTools?: boolean;
  parentSlug?: string;
  children?: SeriesChild[];
  beforeAfterExamples?: BeforeAfterPair[];
}

// Taxonomy types
export interface TaxonomySubcategory {
  id: string;
  title: string;
  slug: string;
  description: string;
}

export interface TaxonomyCategory {
  id: string;
  title: string;
  slug: string;
  description: string;
  featured: boolean;
  isTools?: boolean;
  subcategories: TaxonomySubcategory[];
}

export interface TaxonomyData {
  categories: TaxonomyCategory[];
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

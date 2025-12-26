import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PhotographerProfile } from '@/types/photographer';
import { PortfolioSeries, SeriesChild } from '@/types/gallery';

interface PortfolioState {
  photographer: PhotographerProfile | null;
  series: PortfolioSeries[];
  loading: boolean;
  error: string | null;
}

interface PortfolioContextType extends PortfolioState {
  getSeriesBySlug: (slug: string) => PortfolioSeries | undefined;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// Helper function to create child series from a parent
function createChildSeries(parent: PortfolioSeries): PortfolioSeries[] {
  if (!parent.children?.length) return [];

  return parent.children.map((child: SeriesChild) => ({
    id: `${parent.id}-${child.slug}`,
    title: child.title,
    slug: child.slug,
    description: child.description || parent.description,
    featured: false,
    parentSlug: parent.slug,
    isTools: parent.isTools,
    images: child.images,
  }));
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortfolioState>({
    photographer: null,
    series: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load photographer profile
        const photographerResponse = await fetch('/data/photographer.json');
        const photographerData = await photographerResponse.json();

        // Load all series
        const seriesSlugs = ['portraits', 'selfies', 'fashion-editorial', 'film-mood', 'enhancements'];
        const seriesPromises = seriesSlugs.map(async (slug) => {
          const response = await fetch(`/data/series/${slug}.json`);
          return response.json();
        });

        const seriesData = await Promise.all(seriesPromises);

        // Create derived subseries from all parents with children
        const allDerivedSubseries = seriesData.flatMap((parent: PortfolioSeries) =>
          createChildSeries(parent)
        );

        setState({
          photographer: photographerData,
          series: [...seriesData, ...allDerivedSubseries],
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          photographer: null,
          series: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load portfolio data',
        });
      }
    };

    loadData();
  }, []);

  const getSeriesBySlug = (slug: string) => {
    return state.series.find((s) => s.slug === slug);
  };

  return (
    <PortfolioContext.Provider value={{ ...state, getSeriesBySlug }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}

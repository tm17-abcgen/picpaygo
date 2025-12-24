import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { usePortfolio } from "@/context/PortfolioContext";
import { FilmstripGallery } from "@/components/gallery/FilmstripGallery";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Home() {
  const { series, photographer, loading, error } = usePortfolio();

  const featuredSeries = series.find((s) => s.featured) || series[0];

  const seoTitle = "AI Portrait Generator - Create Professional Portraits";
  const seoDescription = "Transform your photos into stunning professional portraits with AI. Upload a photo, choose a style, and get magazine-quality results in seconds.";

  useEffect(() => {
    document.title = seoTitle;
  }, []);

  if (loading) {
    return (
      <Layout>
        <SEO title="Loading..." description="Loading portfolio" />
        <div className="h-full flex items-center justify-center">
          <GallerySkeleton />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <SEO title="Error" description="Error loading portfolio" />
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md px-4">
            <p className="text-destructive font-semibold">Error loading portfolio</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-foreground text-background rounded hover:opacity-80 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title={seoTitle} description={seoDescription} type="website" />
      <div className="h-full flex flex-col">
        {/* Hero section */}
        <div className="text-center py-6 px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Create professional images from your own photo
          </h2>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Upload any portrait and transform it into stunning professional photography with AI.
          </p>
          <Link to="/generate">
            <Button size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Now
            </Button>
          </Link>
        </div>
        
        {/* Gallery */}
        {featuredSeries && (
          <div className="flex-1 flex items-center justify-center">
            <FilmstripGallery images={featuredSeries.images} />
          </div>
        )}
      </div>
    </Layout>
  );
}

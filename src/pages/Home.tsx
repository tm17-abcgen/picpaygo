import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { usePortfolio } from "@/context/PortfolioContext";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { StyleExampleSwitcher } from "@/components/home/StyleExampleSwitcher";

export default function Home() {
  const { photographer, loading, error } = usePortfolio();

  const seoTitle = "PicPayGo - Transform Your Photos";
  const seoDescription = "Transform your photos into stunning professional images. Upload a photo, choose a style, and get magazine-quality results in seconds.";

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
      <div className="flex flex-col items-center gap-6 py-4 sm:py-6">
        <div className="grain-panel rounded-[36px] border border-border/50 bg-card/40 px-6 py-5 max-w-4xl space-y-2 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-6 bg-border/50" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              PicPayGo
            </p>
            <div className="h-px w-6 bg-border/50" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            Transform your photos into professional images
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Upload a photo, choose a style, and receive a clean, professional image that
            still looks like you. Every generation is unique—like capturing a new moment each time.
          </p>
          <div className="flex justify-center pt-1">
            <Link to="/generate">
              <Button size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Now
              </Button>
            </Link>
          </div>
        </div>
        
        <StyleExampleSwitcher />
      </div>
    </Layout>
  );
}

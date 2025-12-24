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

  const seoTitle = "AI Portrait Generator - Create Professional Portraits";
  const seoDescription = "Transform your photos into stunning professional portraits with AI. Upload a photo, choose a style, and get magazine-quality results in seconds.";

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
      <div className="flex flex-col items-center gap-8 py-4 sm:py-6">
        <div className="text-center px-4 max-w-3xl space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            PicPayGo Studio
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Transform your photos into professional portraits
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Upload a portrait, choose an editorial direction, and receive a clean, professional image that
            still looks like you.
          </p>
          <Link to="/generate">
            <Button size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Now
            </Button>
          </Link>
        </div>
        
        <StyleExampleSwitcher />
      </div>
    </Layout>
  );
}

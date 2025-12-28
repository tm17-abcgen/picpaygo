import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { usePortfolio } from "@/context/PortfolioContext";
import { FilmstripGallery } from "@/components/gallery/FilmstripGallery";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";
import { SEO } from "@/components/seo/SEO";
import { SubseriesPreviewCard } from "@/components/gallery/SubseriesPreviewCard";
import { EnhancementShowcase } from "@/components/comparison";
import NotFound from "./NotFound";

export default function SeriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getSeriesBySlug, photographer, loading } = usePortfolio();

  const series = slug ? getSeriesBySlug(slug) : null;
  const parentSeries = series?.parentSlug ? getSeriesBySlug(series.parentSlug) : undefined;

  const seoTitle = series
    ? `${series.title} - ${photographer?.name || "Portrait Photographer"}`
    : photographer?.name || "Portrait Photographer";

  const seoDescription =
    series?.description ||
    `${series?.title || "Photography"} series by ${photographer?.name || "professional photographer"}`;

  const structuredData = series
    ? series.children?.length
      ? {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: series.title,
          description: series.description,
          hasPart: series.children.map((child) => ({
            "@type": "CollectionPage",
            name: child.title,
            url: `/series/${child.slug}`,
          })),
        }
      : {
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: series.title,
          description: series.description,
          image: series.images.map((img) => ({
            "@type": "ImageObject",
            url: img.src,
            caption: img.caption,
          })),
        }
    : undefined;

  useEffect(() => {
    if (series) {
      document.title = seoTitle;
    }
  }, [series, seoTitle]);

  if (loading) {
    return (
      <Layout>
        <SEO title="Loading..." description="Loading series" />
        <div className="h-full flex items-center justify-center">
          <GallerySkeleton />
        </div>
      </Layout>
    );
  }

  if (!series) {
    return <NotFound />;
  }

  if (series.children?.length) {
    const childCards = series.children
      .map((child) => {
        const childSeries = getSeriesBySlug(child.slug);
        if (!childSeries) return null;
        return { child, series: childSeries };
      })
      .filter(Boolean) as { child: { slug: string; title: string; description?: string }; series: NonNullable<ReturnType<typeof getSeriesBySlug>> }[];

    const isToolsCategory = series.isTools === true;

    return (
      <Layout>
        <SEO
          title={seoTitle}
          description={seoDescription}
          image={series.images?.[0]?.src}
          type="article"
          structuredData={structuredData}
        />

        <div className="w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-12">
          <div className="mx-auto w-full max-w-[1200px]">
            <header className="max-w-[52rem]">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
                {series.title}
              </h1>
              <p className="mt-3 text-base sm:text-[1.0625rem] leading-7 text-muted-foreground">
                {series.description}
              </p>
            </header>

            {/* Tools with Before/After Sliders OR Subseries Grid */}
            <section className="mt-10 sm:mt-12">
              {isToolsCategory ? (
                <EnhancementShowcase
                  tools={childCards.map(({ child, series: childSeries }) => ({
                    slug: child.slug,
                    title: child.title,
                    description: child.description,
                    beforeAfterExamples: childSeries.beforeAfterExamples,
                  }))}
                />
              ) : (
                <div className="grid items-stretch grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                  {childCards.map(({ child, series: childSeries }) => (
                    <SubseriesPreviewCard
                      key={child.slug}
                      title={child.title}
                      to={`/series/${child.slug}`}
                      images={childSeries.images.slice(0, 4)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </Layout>
    );
  }

  const showParentNav = !!series.parentSlug && !!parentSeries;
  const parentTitle = parentSeries?.title || "Portraits";
  const siblings = parentSeries?.children || [];
  const gallerySpacing =
    showParentNav && siblings.length > 0 ? "mt-6 sm:mt-8" : "mt-10 sm:mt-12";

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={series.images[0]?.src}
        type="article"
        structuredData={structuredData}
      />
      <div className="w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-12">
        <div className="mx-auto w-full max-w-[1200px]">
          {showParentNav ? (
            <Link
              to={`/series/${parentSeries!.slug}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {parentTitle}
            </Link>
          ) : null}

          <header className={showParentNav ? "mt-6 sm:mt-8" : ""}>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
              {series.title}
            </h1>
            <p className="mt-3 text-base sm:text-[1.0625rem] leading-7 text-muted-foreground max-w-[52rem]">
              {series.description}
            </p>

            {showParentNav && siblings.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {siblings.map((child) => {
                  const isActive = child.slug === series.slug;
                  return (
                    <Link
                      key={child.slug}
                      to={`/series/${child.slug}`}
                      className={[
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        "ring-1 ring-border/70",
                        isActive
                          ? "bg-foreground text-background ring-foreground/20"
                          : "bg-background text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                      ].join(" ")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {child.title}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </header>

          <div className={`${gallerySpacing} flex justify-center`}>
            <FilmstripGallery images={series.images} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

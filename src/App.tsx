import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { CreditsProvider } from "@/context/CreditsContext";
import { Layout } from "@/components/layout/Layout";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";

const Home = lazy(() => import("./pages/Home"));
const SeriesPage = lazy(() => import("./pages/SeriesPage"));
const Generate = lazy(() => import("./pages/Generate"));
const Account = lazy(() => import("./pages/Account"));
const Verify = lazy(() => import("./pages/Verify"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <Layout>
    <div className="h-full flex items-center justify-center px-4 sm:px-8 lg:px-12">
      <GallerySkeleton />
    </div>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PortfolioProvider>
          <CreditsProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/series/:slug" element={<SeriesPage />} />
                <Route path="/generate" element={<Generate />} />
                <Route path="/account" element={<Account />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </CreditsProvider>
        </PortfolioProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

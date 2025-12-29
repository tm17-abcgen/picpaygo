import { Suspense, lazy } from "react";
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
const Contact = lazy(() => import("./pages/Contact"));
const Verify = lazy(() => import("./pages/Verify"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Imprint = lazy(() => import("./pages/Imprint"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
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
                <Route path="/contact" element={<Contact />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/imprint" element={<Imprint />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
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

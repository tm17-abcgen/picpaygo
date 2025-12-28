import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ChevronDown } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CreditsBadge } from "@/components/credits/CreditsBadge";
import { cn } from "@/lib/utils";

export function HeaderNavigation() {
  const { photographer, series } = usePortfolio();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCollection, setShowCollection] = useState(false);

  if (!photographer) return null;

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
    setShowCollection(false);
  };

  // Filter out demo from series for Collection dropdown
  const collectionSeries = series.filter((s) => s.slug !== 'demo' && !s.parentSlug);

  const isCollectionActive = location.pathname.startsWith('/series/');

  return (
    <div className="relative w-full">
      <div className="flex items-end justify-between mb-2">
        <div className="flex justify-between md:justify-start w-full md:w-fit md:flex-col gap-4">
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/logo/Logo.svg" 
              alt={photographer.name}
              className="h-8 sm:h-10 lg:h-12 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Mobile: Hamburger Menu */}
          <div className="sm:hidden flex items-center gap-2">
            <CreditsBadge />
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 -m-2 hover:opacity-70 transition-opacity" aria-label="Open navigation menu">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-8">
                  <ul className="flex flex-col gap-6">
                    <li>
                      <Link
                        to="/"
                        onClick={handleNavClick}
                        className={`text-lg transition-all duration-200 ${
                          isActive('/') ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/generate"
                        onClick={handleNavClick}
                        className={`text-lg transition-all duration-200 ${
                          isActive('/generate') ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Generate
                      </Link>
                    </li>
                    <li>
                      <span className="text-lg font-medium text-foreground">Collection</span>
                      <ul className="mt-3 ml-4 flex flex-col gap-3">
                        {collectionSeries.map((s) => (
                          <li key={s.slug}>
                            <Link
                              to={`/series/${s.slug}`}
                              onClick={handleNavClick}
                              className={`text-base transition-all duration-200 ${
                                isActive(`/series/${s.slug}`) ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {s.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li>
                      <Link
                        to="/account"
                        onClick={handleNavClick}
                        className={`text-lg transition-all duration-200 ${
                          isActive('/account') ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Account
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/contact"
                        onClick={handleNavClick}
                        className={`text-lg transition-all duration-200 ${
                          isActive('/contact') ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Contact Us
                      </Link>
                    </li>
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:block">
            <ul className="flex flex-row flex-wrap items-center gap-4 sm:gap-5 lg:gap-6">
              <li>
                <Link
                  to="/"
                  className={`text-sm sm:text-base lg:text-[1.0625rem] leading-[1.375rem] transition-all duration-200 ${
                    isActive('/') ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/generate"
                  className={`text-sm sm:text-base lg:text-[1.0625rem] leading-[1.375rem] transition-all duration-200 ${
                    isActive('/generate') ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Generate
                </Link>
              </li>
              
              {/* Collection dropdown */}
              <li className="relative">
                <button
                  onClick={() => setShowCollection(!showCollection)}
                  onBlur={() => setTimeout(() => setShowCollection(false), 150)}
                  className={cn(
                    "flex items-center gap-1 text-sm sm:text-base lg:text-[1.0625rem] leading-[1.375rem] transition-all duration-200",
                    isCollectionActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                  )}
                >
                  Collection
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showCollection && "rotate-180")} />
                </button>
                
                {showCollection && (
                  <div className="absolute top-full left-0 mt-2 py-2 bg-background border border-border rounded-lg shadow-lg min-w-[160px] z-50">
                    {collectionSeries.map((s) => (
                      <Link
                        key={s.slug}
                        to={`/series/${s.slug}`}
                        onClick={() => setShowCollection(false)}
                        className={cn(
                          "block px-4 py-2 text-sm transition-colors",
                          isActive(`/series/${s.slug}`) 
                            ? "font-semibold text-foreground bg-secondary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                      >
                        {s.title}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
              
              <li>
                <Link
                  to="/account"
                  className={`text-sm sm:text-base lg:text-[1.0625rem] leading-[1.375rem] transition-all duration-200 ${
                    isActive('/account') ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Account
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className={`text-sm sm:text-base lg:text-[1.0625rem] leading-[1.375rem] transition-all duration-200 ${
                    isActive('/contact') ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Desktop Credits Badge */}
        <div className="hidden sm:block">
          <CreditsBadge />
        </div>
      </div>
    </div>
  );
}

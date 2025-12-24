import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CreditsBadge } from "@/components/credits/CreditsBadge";

export function HeaderNavigation() {
  const { photographer, series } = usePortfolio();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!photographer) return null;

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  const navLinks = [
    { path: "/generate", label: "Generate" },
    ...series.map((s) => ({ path: `/series/${s.slug}`, label: s.title })),
    { path: "/instructions", label: "Instructions" },
    { path: "/account", label: "Account" },
  ];

  return (
    <div className="relative w-full">
      <div className="flex items-end justify-between mb-2">
        <div className="flex justify-between md:justify-start w-full md:w-fit md:flex-col gap-4">
          <Link to="/" className="flex-shrink-0">
            <h1 className="font-sans text-2xl sm:text-[2.1rem] lg:text-[2.4rem] leading-tight font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
              {photographer.name}
            </h1>
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
                    {navLinks.map((link) => (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          onClick={handleNavClick}
                          className={`text-lg transition-all duration-200 ${
                            isActive(link.path) ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:block">
            <ul className="flex flex-row flex-wrap gap-4 sm:gap-5 lg:gap-6">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`text-sm sm:text-base lg:text-[1.0625rem] leading-[1.375rem] transition-all duration-200 ${
                      isActive(link.path) ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
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

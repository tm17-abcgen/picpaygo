import { Link } from 'react-router-dom';
import { usePortfolio } from '@/context/PortfolioContext';

export function Footer() {
  const { photographer } = usePortfolio();

  if (!photographer) return null;

  return (
    <div className="w-full bg-gray-900 text-gray-300">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {/* Top Section: Logo and Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/logo/Logo.svg" 
              alt={photographer.name}
              className="h-6 sm:h-8 w-auto"
            />
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm sm:text-base leading-tight">
                {photographer.name.toUpperCase()}
              </span>
            </div>
          </Link>

          {/* Copyright */}
          <p className="text-[0.8125rem] sm:text-sm text-gray-400 text-center sm:text-right">
            &copy; {new Date().getFullYear()} {photographer.name}. All Rights Reserved.
          </p>
        </div>

        {/* Dividing Line */}
        <div className="border-t border-gray-700 my-4"></div>

        {/* Bottom Section: Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link
            to="/privacy-policy"
            className="text-[0.8125rem] sm:text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-conditions"
            className="text-[0.8125rem] sm:text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Terms & Conditions
          </Link>
          <Link
            to="/imprint"
            className="text-[0.8125rem] sm:text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Imprint
          </Link>
        </div>
      </div>
    </div>
  );
}

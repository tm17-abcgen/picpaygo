import { Link } from 'react-router-dom';
import { usePortfolio } from '@/context/PortfolioContext';

export function Footer() {
  const { photographer } = usePortfolio();

  if (!photographer) return null;

  return (
    <div className="w-full bg-white text-gray-700">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {/* Top Section: Logo and Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/logo/Logo.svg" 
              alt={photographer.name}
              className="h-6 sm:h-8 w-auto"
            />
          </Link>

          {/* Copyright */}
          <p className="text-[0.8125rem] sm:text-sm text-gray-500 text-center sm:text-right">
            &copy; {new Date().getFullYear()} {photographer.name}. All Rights Reserved.
          </p>
        </div>

        {/* Dividing Line */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Bottom Section: Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link
            to="/privacy-policy"
            className="text-[0.8125rem] sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-conditions"
            className="text-[0.8125rem] sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Terms & Conditions
          </Link>
          <Link
            to="/imprint"
            className="text-[0.8125rem] sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Imprint
          </Link>
        </div>
      </div>
    </div>
  );
}

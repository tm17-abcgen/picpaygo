import { Link } from 'react-router-dom';
import { usePortfolio } from '@/context/PortfolioContext';

export function Footer() {
  const { photographer } = usePortfolio();

  if (!photographer) return null;

  // Simple email obfuscation by replacing @ with [at]
  const obfuscateEmail = (email: string) => email.replace('@', '[at]');

  return (
    <div className="h-full flex items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8 border-t border-gray-200 bg-background">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[0.8125rem] leading-4 text-gray-500">
          {/* Contact Links */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              to="/contact"
              className="hover:text-gray-700 transition-colors"
            >
              Contact Us
            </Link>
            <a
              href={`mailto:${photographer.contact.email}`}
              className="hover:text-gray-700 transition-colors"
              aria-label={`Email ${photographer.name}`}
            >
              {obfuscateEmail(photographer.contact.email)}
            </a>
          </div>

          {/* Copyright */}
          <p className="text-center sm:text-right">
            &copy; {new Date().getFullYear()} {photographer.name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

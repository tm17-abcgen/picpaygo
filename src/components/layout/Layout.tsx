import { ReactNode } from "react";
import { HeaderNavigation } from "./HeaderNavigation";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div
      className="grid w-screen min-h-screen items-start layout-home"
      style={{
        overscrollBehavior: "contain",
      }}
    >
      <style>{`
        .layout-home {
          grid-template-columns: [full-start] 1rem [content-start] 1fr [content-end] 1rem [full-end];
        }
        @media (min-width: 768px) {
          .layout-home {
            grid-template-columns: [full-start] 2.5rem [content-start] 1fr [content-end] 2.5rem [full-end];
          }
        }
        @media (min-width: 1024px) {
          .layout-home {
            grid-template-columns: [full-start] 1fr [content-start] min(1200px, 100%) [content-end] 1fr [full-end];
          }
        }
        /* Safe area padding for notch devices (mobile only) */
        .layout-content {
          padding-top: max(env(safe-area-inset-top, 0px), 1.5rem);
        }
        @media (min-width: 640px) {
          .layout-content {
            padding-top: 32px;
          }
        }
        @media (min-width: 1024px) {
          .layout-content {
            padding-top: 40px;
          }
        }
      `}</style>
      {/* Centered container for header + gallery */}
      <div
        className="layout-content flex flex-col gap-6 sm:gap-8 lg:gap-[50px] pointer-events-auto pb-10 sm:pb-12"
        style={{
          gridColumn: "content-start / content-end",
        }}
      >
        {/* Header: Minimal height */}
        <header className="flex-shrink-0 flex justify-center">
          <HeaderNavigation />
        </header>

        {/* Main Content: Gallery */}
        <main className="flex-shrink-0">{children}</main>

        {/* Footer with contact info */}
        <footer className="flex-shrink-0 mt-6 sm:mt-8 lg:mt-10">
          <Footer />
        </footer>
      </div>
    </div>
  );
}

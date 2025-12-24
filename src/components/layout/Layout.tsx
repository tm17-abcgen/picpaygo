import { ReactNode } from "react";
import { HeaderNavigation } from "./HeaderNavigation";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div
      className="grid w-screen min-h-screen overflow-y-auto items-start layout-home"
      style={{
        gridTemplateRows: "auto 1fr",
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
            grid-template-rows: auto minmax(500px, calc(100vh - 200px)) auto;
          }
        }
        @media (min-width: 1024px) {
          .layout-home {
            grid-template-columns: [full-start] 1fr [content-start] min(1200px, 100%) [content-end] 1fr [full-end];
            grid-template-rows: auto min(740px, calc(100vh - 260px)) auto;
          }
        }
      `}</style>
      {/* Centered container for header + gallery */}
      <div
        className="flex flex-col gap-6 sm:gap-8 lg:gap-[50px] pointer-events-auto pt-[100px] sm:pt-[120px] lg:pt-[140px]"
        style={{
          gridColumn: "content-start / content-end",
          gridRow: "2",
        }}
      >
        {/* Header: Minimal height */}
        <header className="flex-shrink-0 flex justify-center">
          <HeaderNavigation />
        </header>

        {/* Main Content: Gallery */}
        <main className="flex-shrink-0">{children}</main>
      </div>
    </div>
  );
}

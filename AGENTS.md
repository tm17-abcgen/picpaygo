# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + React + TypeScript app. Source lives in `src/`:
- `src/pages/` for route-level screens (`Home`, `SeriesPage`, `About`, `NotFound`).
- `src/components/` for reusable UI (`gallery/`, `layout/`, `seo/`, `ui/`).
- `src/context/` for global data loading (`PortfolioContext`).
- `src/hooks/`, `src/lib/`, `src/types/` for hooks, utilities, and types.
- Styles in `src/index.css`, `src/App.css`, and `src/styles/lightbox.css`.
Static assets and content live in `public/`, including `public/data/photographer.json` and `public/data/series/*.json`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server (port 8080).
- `npm run build`: production build to `dist/`.
- `npm run build:dev`: development-mode build.
- `npm run preview`: serve `dist/` locally.
- `npm run lint`: run ESLint.

## Coding Style & Naming Conventions
- Use TypeScript and React function components; keep hooks named `useX` in `src/hooks/`.
- Match the file’s existing formatting (indentation and quote style vary across files).
- Components and pages use PascalCase filenames; utilities are camelCase.
- Use the `@/` alias for `src` imports (see `vite.config.ts` and `tsconfig.json`).
- Prefer Tailwind utility classes; put global tweaks in the CSS files listed above.
- Series/data files use lowercase slugs (e.g., `public/data/series/portraits.json`).

## Testing Guidelines
- No automated test runner is configured and there is no `npm test` script.
- For now, rely on `npm run lint` plus manual checks of `/`, `/about`, and `/series/:slug`.
- If you add a test runner, use `*.test.tsx` and document the command in `package.json`.

## Commit & Pull Request Guidelines
- Git history only includes “Initial commit from remix”; no established convention yet.
- Use short, imperative commit summaries (e.g., `Add editorial series data`).
- PRs should include a clear description, UI screenshots for visual changes, and links to related issues.

## Content & Configuration Notes
- Update `public/data/photographer.json` for profile content.
- Add new series JSON under `public/data/series/` and update the slug list in `src/context/PortfolioContext.tsx` so it loads.

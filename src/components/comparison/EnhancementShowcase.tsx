import { BeforeAfterSlider } from './BeforeAfterSlider';
import type { BeforeAfterPair } from '@/types/gallery';

interface EnhancementTool {
  slug: string;
  title: string;
  description?: string;
  beforeAfterExamples?: BeforeAfterPair[];
}

interface EnhancementShowcaseProps {
  tools: EnhancementTool[];
}

export function EnhancementShowcase({ tools }: EnhancementShowcaseProps) {
  // Filter to only tools that have before/after examples
  const toolsWithExamples = tools.filter(
    tool => tool.beforeAfterExamples && tool.beforeAfterExamples.length > 0
  );

  if (toolsWithExamples.length === 0) {
    return null;
  }

  return (
    <div className="grid items-stretch grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
      {toolsWithExamples.map(tool => {
        const example = tool.beforeAfterExamples![0];
        return (
          <BeforeAfterSlider
            key={tool.slug}
            beforeImage={example.before}
            afterImage={example.after}
            toolTitle={tool.title}
            description={tool.description || ''}
            to={`/generate?tool=${tool.slug}`}
          />
        );
      })}
    </div>
  );
}

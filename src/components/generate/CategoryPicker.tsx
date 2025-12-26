import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationCategory } from '@/types/generation';
import { CATEGORY_LABELS } from '@/types/generation';

interface TaxonomyData {
  categories: {
    slug: string;
    title: string;
    description: string;
    isTools?: boolean;
    subcategories: {
      id: string;
      slug: string;
      title: string;
      description: string;
    }[];
  }[];
}

interface CategoryPickerProps {
  selected: GenerationCategory | null;
  onChange: (category: GenerationCategory) => void;
  disabled?: boolean;
}

function SubcategoryButton({
  subcategory,
  isSelected,
  onSelect,
  disabled,
}: {
  subcategory: { id: string; slug: string; title: string; description: string };
  isSelected: boolean;
  onSelect: (slug: GenerationCategory) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(subcategory.slug as GenerationCategory)}
      disabled={disabled}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        isSelected
          ? 'border-accent bg-accent/5'
          : 'border-border/60 hover:border-accent/30 hover:bg-muted/20',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
            isSelected ? 'border-accent bg-accent' : 'border-muted-foreground'
          )}
        >
          {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm">{subcategory.title}</span>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {subcategory.description}
          </p>
        </div>
      </div>
    </button>
  );
}

function CategoryCard({
  category,
  isExpanded,
  onToggle,
  selectedSubcategory,
  onSubcategorySelect,
  disabled,
}: {
  category: {
    slug: string;
    title: string;
    description: string;
    subcategories: { id: string; slug: string; title: string; description: string }[];
  };
  isExpanded: boolean;
  onToggle: () => void;
  selectedSubcategory: GenerationCategory | null;
  onSubcategorySelect: (slug: GenerationCategory) => void;
  disabled?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );

  return (
    <div
      className={cn(
        'border rounded-xl bg-background transition-all duration-200',
        'focus-within:ring-2 focus-within:ring-accent/20',
        isExpanded
          ? 'border-accent shadow-sm'
          : 'border-border hover:border-accent/40 hover:shadow-sm'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full flex items-start gap-3 p-4 text-left',
          'focus-visible:outline-none',
          'transition-colors duration-200'
        )}
        aria-expanded={isExpanded}
        aria-controls={`subcategory-list-${category.slug}`}
      >
        <ChevronDown
          className={cn(
            'h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground transition-transform duration-250 ease-out',
            isExpanded && 'rotate-180'
          )}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg tracking-tight">{category.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {category.description}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            {category.subcategories.length} option
            {category.subcategories.length !== 1 ? 's' : ''}
          </p>
        </div>
      </button>

      <div
        id={`subcategory-list-${category.slug}`}
        role="region"
        aria-labelledby={`category-${category.slug}`}
        className="overflow-hidden transition-all duration-250 ease-out"
        style={{
          maxHeight: isExpanded ? contentHeight : 0,
        }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          <div className="pt-2 space-y-2">
            {category.subcategories.map((subcategory) => (
              <SubcategoryButton
                key={subcategory.id}
                subcategory={subcategory}
                isSelected={selectedSubcategory === subcategory.slug}
                onSelect={onSubcategorySelect}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryPicker({ selected, onChange, disabled }: CategoryPickerProps) {
  const [taxonomy, setTaxonomy] = useState<TaxonomyData | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/taxonomy.json')
      .then((res) => res.json())
      .then((data) => {
        setTaxonomy(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleToggle = useCallback((slug: string) => {
    setExpandedSlug((prev) => (prev === slug ? null : slug));
  }, []);

  const handleSubcategorySelect = useCallback(
    (subSlug: GenerationCategory) => {
      onChange(subSlug);
    },
    [onChange]
  );

  const handleClearSelection = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && expandedSlug) {
        setExpandedSlug(null);
      }
    },
    [expandedSlug]
  );

  const selectedLabel = selected ? CATEGORY_LABELS[selected] : null;

  if (loading) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Choose a style</label>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-muted/50 rounded-xl"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-foreground">Choose a style</label>
        {selectedLabel && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm',
              'bg-accent/10 text-accent',
              'transition-opacity duration-200',
              !disabled && 'hover:bg-accent/15 cursor-pointer'
            )}
            onClick={!disabled ? handleClearSelection : undefined}
            role="button"
            tabIndex={!disabled ? 0 : undefined}
            aria-label="Clear selection"
          >
            <span className="font-medium">Selected: {selectedLabel}</span>
            {!disabled && (
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {taxonomy?.categories.map((category) => (
          <CategoryCard
            key={category.slug}
            category={category}
            isExpanded={expandedSlug === category.slug}
            onToggle={() => handleToggle(category.slug)}
            selectedSubcategory={selected}
            onSubcategorySelect={handleSubcategorySelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

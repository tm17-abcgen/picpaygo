import { useState, useEffect } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
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

export function CategoryPicker({ selected, onChange, disabled }: CategoryPickerProps) {
  const [taxonomy, setTaxonomy] = useState<TaxonomyData | null>(null);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
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

  // Find which parent category the selected subcategory belongs to
  useEffect(() => {
    if (selected && taxonomy) {
      for (const parent of taxonomy.categories) {
        if (parent.subcategories.some((sub) => sub.slug === selected)) {
          setSelectedParent(parent.slug);
          break;
        }
      }
    }
  }, [selected, taxonomy]);

  const selectedParentData = taxonomy?.categories.find((c) => c.slug === selectedParent);
  const subcategories = selectedParentData?.subcategories ?? [];

  const handleParentSelect = (parentSlug: string) => {
    setSelectedParent(parentSlug);
  };

  const handleSubcategorySelect = (subSlug: GenerationCategory) => {
    onChange(subSlug);
  };

  const handleBack = () => {
    setSelectedParent(null);
    onChange(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Choose a style
        </label>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Show subcategories within selected parent
  if (selectedParent && selectedParentData) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={disabled}
            className="p-1 -ml-1 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Back to categories"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <label className="text-sm font-medium text-foreground">
            Choose {selectedParentData.title.toLowerCase()}
          </label>
        </div>
        <div className="grid gap-2">
          {subcategories.map((subcategory) => (
            <button
              key={subcategory.id}
              onClick={() => handleSubcategorySelect(subcategory.slug as GenerationCategory)}
              disabled={disabled}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all',
                selected === subcategory.slug
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-pressed={selected === subcategory.slug}
            >
              <div
                className={cn(
                  'w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                  selected === subcategory.slug
                    ? 'border-accent bg-accent'
                    : 'border-muted-foreground'
                )}
              >
                {selected === subcategory.slug && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1">
                <span className="font-medium">{subcategory.title}</span>
                <p className="text-sm text-muted-foreground mt-0.5">{subcategory.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 1: Show parent categories
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Choose a style
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {taxonomy?.categories.map((category) => (
          <button
            key={category.slug}
            onClick={() => handleParentSelect(category.slug)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-left transition-all',
              selectedParent === category.slug
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-accent/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-pressed={selectedParent === category.slug}
          >
            <div>
              <span className="font-medium">{category.title}</span>
              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
            </div>
            <div className="text-xs text-muted-foreground mt-auto">
              {category.subcategories.length} option{category.subcategories.length !== 1 ? 's' : ''}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

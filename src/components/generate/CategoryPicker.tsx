import { Check } from 'lucide-react';

export type Category = 'studio-portrait' | 'fashion-editorial' | 'editorial-moment' | 'portrait-honest';

interface CategoryPickerProps {
  selected: Category;
  onChange: (category: Category) => void;
  disabled?: boolean;
}

const categories: { id: Category; label: string; description: string }[] = [
  { id: 'studio-portrait', label: 'Studio Portrait', description: 'Natural presence with authentic features' },
  { id: 'fashion-editorial', label: 'Fashion Editorial', description: 'Authentic styling celebrating real beauty' },
  { id: 'editorial-moment', label: 'Editorial Moment', description: 'Real-life candid street photography style' },
  { id: 'portrait-honest', label: 'Honest Portrait', description: 'Clinical realism documenting truth' },
];

export function CategoryPicker({ selected, onChange, disabled }: CategoryPickerProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Choose a style
      </label>
      <div className="grid gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onChange(category.id)}
            disabled={disabled}
            className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
              selected === category.id
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-accent/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-pressed={selected === category.id}
          >
            <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              selected === category.id ? 'border-accent bg-accent' : 'border-muted-foreground'
            }`}>
              {selected === category.id && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <div>
              <span className="font-medium">{category.label}</span>
              <p className="text-sm text-muted-foreground mt-0.5">{category.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

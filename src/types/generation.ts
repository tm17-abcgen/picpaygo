// All subcategory slugs - generated from taxonomy, single source of truth
export type GenerationCategory =
  // Portraits
  | 'professional-headshot'
  | 'business-portrait'
  | '90s-point-and-shoot'
  | 'canon-ixus-aesthetic'
  | 'left-profile'
  | 'right-profile'
  // Selfies
  | 'mirror-selfie-2000s'
  | 'bathroom-mirror-selfie'
  // Fashion / Editorial
  | 'studio-vogue-editorial'
  // Film / Mood
  | 'emotional-film'
  // Enhancements
  | 'crowd-removal'
  | 'upscaling'
  | 'restoration';

export interface GenerationCategoryInfo {
  id: GenerationCategory;
  label: string;
  description: string;
  parentSlug: string;
  isTool?: boolean;
}

// Category labels for UI display
export const CATEGORY_LABELS: Record<GenerationCategory, string> = {
  // Portraits
  'professional-headshot': 'Professional Headshot',
  'business-portrait': 'Business Portrait',
  '90s-point-and-shoot': '90s Point & Shoot',
  'canon-ixus-aesthetic': 'Canon IXUS',
  'left-profile': 'Left Profile',
  'right-profile': 'Right Profile',
  // Selfies
  'mirror-selfie-2000s': 'Mirror Selfie (2000s)',
  'bathroom-mirror-selfie': 'Bathroom Mirror',
  // Fashion / Editorial
  'studio-vogue-editorial': 'Studio Vogue',
  // Film / Mood
  'emotional-film': 'Emotional Film',
  // Enhancements
  'crowd-removal': 'Crowd Removal',
  'upscaling': 'Upscaling',
  'restoration': 'Restoration',
} as const;

# Enhancement Before/After Slider Implementation Plan

## Overview
Add a draggable before/after image comparison slider to the Enhancement subcategory page (`/series/enhancements`). The slider will showcase one example per tool (crowd-removal, upscaling, restoration) with "ORIGINAL" / "RESTORED" labels and a "DRAG TO COMPARE" instruction.

## Decision: Custom Implementation
**Recommendation**: Build a custom component using Framer Motion (already in project) instead of `react-compare-slider` library.

**Reasoning**:
- Design has specific requirements (corner labels, drag text, expand icon) requiring heavy library customization anyway
- Framer Motion already used extensively throughout codebase
- No additional dependency (smaller bundle)
- Better integration with existing warm design system

---

## Implementation Tasks

### Phase 1: Core Components

#### 1.1 Create BeforeAfterSlider component
**File**: `/src/components/comparison/BeforeAfterSlider.tsx`

```typescript
interface BeforeAfterSliderProps {
  beforeImage: { src: string; alt: string };
  afterImage: { src: string; alt: string };
  beforeLabel?: string;  // Default: "ORIGINAL"
  afterLabel?: string;   // Default: "RESTORED"
  dragText?: string;     // Default: "DRAG TO COMPARE"
  initialPosition?: number;  // Default: 50
  className?: string;
}
```

Key implementation details:
- Use `pointerdown/pointermove/pointerup` events for drag
- CSS `clipPath: inset(0 ${100-position}% 0 0)` for reveal effect
- Keyboard navigation: Arrow keys move 5%, Home/End go to 0/100%
- ARIA: `role="slider"`, `aria-valuenow`, `aria-label`

#### 1.2 Create ComparisonHandle component
**File**: `/src/components/comparison/ComparisonHandle.tsx`

- Circular handle (40px) with `MoveHorizontal` icon from lucide-react
- Visual feedback when dragging (`isDragging` state)
- Match design: white/light background, subtle shadow

#### 1.3 Create barrel export
**File**: `/src/components/comparison/index.ts`

---

### Phase 2: Data Structure Updates

#### 2.1 Add TypeScript interface
**File**: `/src/types/gallery.ts`

```typescript
export interface BeforeAfterPair {
  id: string;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  caption?: string;
}

// Update SeriesChild interface
export interface SeriesChild {
  // ... existing fields
  beforeAfterExamples?: BeforeAfterPair[];
}
```

#### 2.2 Add placeholder data
**File**: `/public/data/series/enhancements.json`

Add `beforeAfterExamples` array to each child with placeholder images:
- crowd-removal: Before (crowded scene) / After (clean scene)
- upscaling: Before (low-res) / After (high-res)
- restoration: Before (damaged photo) / After (restored)

---

### Phase 3: Integration

#### 3.1 Create EnhancementShowcase wrapper
**File**: `/src/components/comparison/EnhancementShowcase.tsx`

- Maps through enhancement tools
- Renders 3 sliders in responsive grid
- Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`

#### 3.2 Update SeriesPage
**File**: `/src/pages/SeriesPage.tsx`

Insert showcase section above ServiceCard grid (around line 106):

```tsx
{isToolsCategory && (
  <>
    {/* Before/After Showcase */}
    <section className="mt-10 sm:mt-12 mb-8">
      <h2 className="text-lg font-medium text-foreground mb-6">
        See the Results
      </h2>
      <EnhancementShowcase tools={childCards} />
    </section>

    {/* Existing Tools Grid */}
    <section>
      <h2 className="text-lg font-medium text-foreground mb-6">
        Available Tools
      </h2>
      {/* ... ServiceCards */}
    </section>
  </>
)}
```

---

### Phase 4: Polish

#### 4.1 Responsive design
- Mobile: Full width, stacked vertically, 48px touch target
- Tablet: 2-column grid
- Desktop: 3-column grid matching ServiceCard layout

#### 4.2 Accessibility
- Keyboard navigation (Arrow keys, Home, End)
- ARIA attributes (`role="slider"`, value indicators)
- Reduced motion support (check `prefers-reduced-motion`)
- Focus visible styles (already in index.css)

#### 4.3 Loading states
- Skeleton placeholder while images load
- Graceful fallback if no examples exist

---

## Files to Modify/Create

| Action | Path |
|--------|------|
| CREATE | `/src/components/comparison/BeforeAfterSlider.tsx` |
| CREATE | `/src/components/comparison/ComparisonHandle.tsx` |
| CREATE | `/src/components/comparison/EnhancementShowcase.tsx` |
| CREATE | `/src/components/comparison/index.ts` |
| MODIFY | `/src/types/gallery.ts` (add BeforeAfterPair interface) |
| MODIFY | `/public/data/series/enhancements.json` (add beforeAfterExamples) |
| MODIFY | `/src/pages/SeriesPage.tsx` (integrate showcase) |

---

## Visual Design (Matching Webpage Aesthetic)

The slider should match the warm, light theme of PicPayGo:

**Container**:
- White card background (`bg-white` or `bg-card`)
- Rounded corners (`rounded-2xl`) matching ServiceCards
- Soft shadow (`shadow-sm` or custom warm shadow)
- Subtle warm border (`border border-border/50`)

**Labels**:
- "Original" top-left, "Enhanced" top-right
- Muted warm gray text (`text-muted-foreground`)
- Small caps or uppercase with tracking (`text-xs tracking-wide uppercase`)
- Semi-transparent background pill for readability over images

**Divider & Handle**:
- Thin vertical line in warm gray (`bg-gray-300`)
- Circular handle (36-40px) with terracotta accent (`bg-accent`)
- White `MoveHorizontal` icon inside handle
- Subtle shadow on handle for depth

**Instruction Text**:
- "Drag to compare" bottom-center
- Muted foreground color, small text
- Optional: fade out after first interaction

**Responsive Behavior**:
- Touch-friendly handle (min 44px tap target)
- Same card styling as ServiceCards for visual consistency
- Grid layout: 1 col mobile → 2 tablet → 3 desktop

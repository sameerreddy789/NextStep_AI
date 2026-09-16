# NextStep AI Design System

## Visual Philosophy: Clay-Glass Hybrid
NextStep AI uses a unique blend of **Claymorphism** and **Glassmorphism** to create a tactile, premium interface.
- **Glassmorphism**: Provides depth and hierarchy through background blurs and subtle borders.
- **Claymorphism**: Adds a soft, tactile feel with dual shadows (inner highlight + outer soft shadow).

## Design Tokens

### Colors (Carbon Slate)
- `bg-primary`: #0F1419
- `bg-secondary`: #1A1F29
- `accent-primary`: #3B82F6 (Blue)
- `accent-green`: #10B981 (Success)
- `accent-gold`: #F59E0B (Warning)
- `accent-red`: #EF4444 (Danger)

### Spacing (8px Grid)
We use a standardized 8px spacing grid:
- `space-1`: 8px
- `space-2`: 16px
- `space-3`: 24px
- `space-4`: 32px
- `space-6`: 48px
- `space-8`: 64px

### Typography
- **Primary Font**: Helvetica Neue / Inter
- **Monospace**: JetBrains Mono (for code snippets)

### Motion & Transitions
Standardized easing and durations for a consistent feel:
- `ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)` (Snappy entry)
- `ease-in-out`: `cubic-bezier(0.4, 0, 0.2, 1)` (Balanced)
- `ease-elastic`: `cubic-bezier(0.34, 1.56, 0.64, 1)` (Playful bounce)
- `duration-fast`: 150ms
- `duration-normal`: 300ms
- `duration-slow`: 500ms

## Core Components

### 1. Cards
- `.card`: Standard Glassmorphic card.
- `.clay-card`: Soft, tactile Claymorphic card.
- `.card-interactive`: Card with hover-lift and scale effects.

### 2. Buttons
- `.btn-primary`: Vibrant blue gradient with glow.
- `.btn-secondary`: Transparent glass with border.
- `.clay-btn`: Highly tactile "squishy" button.

### 3. Inputs
- `.form-input`: Subtle glass container.
- `.clay-input`: Inset shadow "pressed" look.

## Accessibility
- **Focus States**: High-contrast blue rings on all interactive elements.
- **Contrast**: Compliant with WCAG 2.1 AA for primary text.
- **Motion**: Reduced motion considerations (via CSS variables).

## Implementation Guidelines
- Use CSS Variables for all aesthetic properties.
- Prefer `gap` for layout spacing.
- Apply `backdrop-filter` for glass components (with fallback background colors).

---
name: ui-components
description: How to use and extend the shared UI component library in site/components/ui/.
---

# UI Components

`site/components/ui/` is the **first place to look** before writing any button, input, form field, drawer, or other general-purpose UI element.

## Rule 1 — Check `components/ui/` before writing raw HTML

Before building a button, input, drawer, modal trigger, or any generic interactive element, check whether a component for it already exists in `site/components/ui/`. Use it instead of writing raw HTML with inline Tailwind.

```
❌  <button className="px-5 py-2.5 text-sm bg-charcoal text-white rounded-sm ...">Save</button>

✅  import Button from '@/components/ui/Button';
    <Button>Save</Button>
```

## Rule 2 — Extract generic UI into `components/ui/`

When creating a new component, ask: **"Is this reusable across different features, or is it specific to one use case?"**

| Generic → goes in `components/ui/` | Feature-specific → stays in its feature folder |
|---|---|
| Modal dialog wrapper | `ReturnModal` |
| Toast / notification | `OrderStatusBadge` |
| Select / dropdown wrapper | `RecurringPriceSelector` |
| Badge / pill | `ShipmentTimeline` |
| Spinner / skeleton | `WishlistCard` |
| Textarea wrapper | `AddToWishlistButton` |

If you write a new piece of UI that could plausibly be used in more than one place (another page, another feature), create it in `components/ui/` first, then import it in the specific component.

---

## Available components

### `Button`

```typescript
import Button from '@/components/ui/Button';
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | |
| `isLoading` | `boolean` | `false` | Shows spinner, disables button |
| `disabled` | `boolean` | — | Standard HTML disabled |
| `className` | `string` | `''` | Merged onto the button |
| All native `<button>` attrs | — | — | `onClick`, `type`, `aria-*`, etc. |

```tsx
// Primary (dark charcoal fill)
<Button onClick={handleSave}>Save changes</Button>

// Loading state
<Button isLoading={submitting}>Submit</Button>

// Secondary (terra/red fill) — destructive or accent actions
<Button variant="secondary" size="sm">Remove</Button>

// Outline — secondary actions
<Button variant="outline">Cancel</Button>

// Ghost — icon-only or low-emphasis
<Button variant="ghost" size="sm" aria-label="Edit">✎</Button>

// Submit inside a <form>
<Button type="submit" disabled={!isValid}>Place order</Button>
```

---

### `Input`

```typescript
import Input from '@/components/ui/Input';
```

| Prop | Type | Notes |
|---|---|---|
| `label` | `string` | Renders an accessible `<label>` linked via `htmlFor`/`id` |
| `error` | `string` | Shows error text below the input, turns border red |
| All native `<input>` attrs | — | `type`, `placeholder`, `value`, `onChange`, `ref`, etc. |

`Input` is a `forwardRef` component — refs work correctly for form libraries and focus management.

```tsx
// Basic
<Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />

// With error
<Input label="Password" type="password" error={errors.password} value={password} onChange={e => setPassword(e.target.value)} />

// No label (e.g. search bar)
<Input type="search" placeholder="Search products…" />
```

---

### `Drawer`

```typescript
import { Drawer } from '@/components/ui/Drawer';
```

A slide-in panel from the left or right edge of the screen. Handles body scroll locking, backdrop click to close, and ARIA dialog semantics automatically.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `isOpen` | `boolean` | — | Controls open/closed state |
| `onClose` | `() => void` | — | Called on backdrop click or × button |
| `title` | `string` | — | Shown in the panel header |
| `children` | `ReactNode` | — | Scrollable content area |
| `footer` | `ReactNode` | — | Pinned to the bottom of the panel |
| `position` | `'left' \| 'right'` | `'right'` | Slide direction |

```tsx
const [open, setOpen] = useState(false);

<Drawer
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Filters"
  footer={
    <div className="p-5 border-t border-border flex gap-3">
      <Button variant="outline" onClick={clearAll}>Clear</Button>
      <Button onClick={() => setOpen(false)}>Apply</Button>
    </div>
  }
>
  {/* filter controls */}
</Drawer>
```

---

## When to add a new component to `components/ui/`

Add a new file here whenever you are building something that:

- Has **no domain knowledge** (doesn't import from `lib/ct/`, `hooks/`, or feature-specific types)
- Could be dropped into any page without modification
- Wraps a native HTML element with project-consistent styling or behaviour (e.g. `Modal`, `Select`, `Textarea`, `Badge`, `Skeleton`, `Toast`)

**Template for a new `components/ui/` file:**

```typescript
// site/components/ui/MyComponent.tsx
'use client'; // only if it uses hooks or event handlers

import { HTMLAttributes } from 'react';

interface MyComponentProps extends HTMLAttributes<HTMLDivElement> {
  // component-specific props
}

export default function MyComponent({ className = '', ...props }: MyComponentProps) {
  return (
    <div className={`/* base styles */ ${className}`} {...props} />
  );
}
```

Keep the interface open (`extends HTML*Attributes`) so callers can pass `aria-*`, `data-*`, and event handlers without needing prop-drilling workarounds.

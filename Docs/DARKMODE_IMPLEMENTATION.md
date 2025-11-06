# Dark Mode Implementation Guide

## Overview
This project now uses a systematic dark mode implementation inspired by **Darkmode.js** (MIT License - Sandoche Adittane), adapted for React + Tailwind CSS.

## Architecture

### Core Component: `utils/darkMode.ts`

The dark mode system is built around a `Darkmode` class that provides:

1. **Automatic Initialization**
   - Checks localStorage for user preference
   - Falls back to OS/system theme preference (`prefers-color-scheme`)
   - Auto-applies dark mode before React renders (no flash)

2. **Persistent Storage**
   - Saves user preference in localStorage as `darkMode: "true"` or `darkMode: "false"`
   - Remembers choice across browser sessions

3. **System Theme Watching**
   - Listens for OS dark mode changes
   - Auto-updates only if user hasn't manually set a preference

4. **Class-Based Approach**
   - Adds `dark` class to `document.documentElement` (Tailwind requirement)
   - Adds `darkmode--activated` class to `body` for additional styling
   - Sets `color-scheme` CSS property for native form controls

## How It Works

### 1. Initialization Flow

```
Module Load → getDarkmodeInstance() → new Darkmode()
                                           ↓
                                    initialize()
                                           ↓
              ┌────────────────────────────┴──────────────────────┐
              ↓                                                    ↓
    Check localStorage                                  No preference?
              ↓                                                    ↓
    User prefers dark?                           Check OS preference
              ↓                                                    ↓
         activate()                                           activate()?
```

### 2. Toggle Flow

```
User clicks toggle → toggleDarkMode() → Darkmode.toggle()
                                              ↓
                                   Check isActivated()
                                              ↓
                          ┌──────────────────┴──────────────────┐
                          ↓                                      ↓
                    Currently Dark?                        Currently Light?
                          ↓                                      ↓
                    deactivate()                            activate()
                          ↓                                      ↓
                Remove 'dark' class                     Add 'dark' class
                Remove 'darkmode--activated'            Add 'darkmode--activated'
                Set colorScheme='light'                 Set colorScheme='dark'
                          ↓                                      ↓
                          └──────────────────┬──────────────────┘
                                             ↓
                            Save to localStorage
                                             ↓
                              Update Zustand store
```

### 3. Class Application

```
<html class="dark">                    ← Tailwind's dark mode trigger
  <body class="darkmode--activated">   ← Custom styling hook
    <div class="bg-white dark:bg-gray-900">
      <!-- Tailwind dark: variants work automatically -->
    </div>
  </body>
</html>
```

## Usage

### In Components

Components use the Zustand store for reactive updates:

```tsx
import { useAppStore } from '../store/appStore';

function MyComponent() {
  const { darkMode, toggleDarkMode } = useAppStore();
  
  return (
    <button onClick={toggleDarkMode}>
      {darkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
```

### Styling with Tailwind

Use Tailwind's `dark:` variant for all color-related classes:

```tsx
// ✅ Correct - Responsive to dark mode
<div className="bg-white dark:bg-gray-900">
<p className="text-gray-900 dark:text-white">

// ❌ Wrong - Hardcoded colors
<div className="bg-gray-900">
<p className="text-white">
```

### CSS Styling

Use the `.darkmode--activated` class for custom CSS:

```css
/* Custom dark mode styles */
body.darkmode--activated {
  background-color: rgb(17 24 39);
  color: rgb(243 244 246);
}

/* Or use standard dark class */
.dark .my-custom-element {
  background: #1a1a1a;
}
```

## API Reference

### `Darkmode` Class

```typescript
class Darkmode {
  constructor(options?: DarkmodeOptions)
  toggle(): void
  isActivated(): boolean
}
```

**Options:**
- `autoMatchOsTheme` (default: `true`) - Auto-enable if OS prefers dark
- `saveInCookies` (default: `true`) - Save preference to localStorage

### Singleton Functions

```typescript
// Get the singleton instance
getDarkmodeInstance(): Darkmode

// Legacy API (for backward compatibility)
initializeDarkMode(): boolean
toggleDarkMode(currentMode: boolean): boolean
applyDarkMode(isDark: boolean): void
```

## Features

✅ **Widget-less Integration** - No visual widget, integrates with existing UI
✅ **Automatic Detection** - Respects OS theme preference
✅ **Persistent State** - Remembers user choice
✅ **No Flash** - Applies before React renders
✅ **Reactive** - Works with Zustand for instant UI updates
✅ **Systematic** - One source of truth, no per-page logic
✅ **TypeScript** - Full type safety
✅ **SSR-Safe** - Checks for browser environment

## Migration from Old System

### Before
```typescript
// Per-page logic
const [darkMode, setDarkMode] = useState(false);

useEffect(() => {
  const stored = localStorage.getItem('darkMode');
  if (stored) setDarkMode(stored === 'true');
}, []);
```

### After
```typescript
// Global store
const { darkMode } = useAppStore();
// That's it! Already initialized and synced
```

## Best Practices

### 1. Always Use Dark Variants

```tsx
// ✅ Good - Clear and predictable
<div className="bg-gray-50 dark:bg-gray-800">

// ❌ Bad - Only visible in one mode
<div className="bg-gray-800">
```

### 2. Test Both Modes

Always check components in both light and dark modes:
- Toggle in the header
- Check text contrast
- Verify borders are visible
- Test form inputs

### 3. Use Semantic Colors

```tsx
// ✅ Good - Semantic and mode-aware
<Alert variant="error">  {/* Uses danger colors with dark mode */}

// ✅ Good - Explicit light/dark colors
<div className="text-gray-900 dark:text-gray-100">

// ❌ Bad - Hardcoded color
<div className="text-white">  {/* Invisible in light mode */}
```

### 4. Avoid Hardcoded Dark Colors

```tsx
// ❌ Wrong - Always dark
<div className="bg-gray-900">

// ✅ Correct - Conditional
<div className="bg-white dark:bg-gray-900">

// ✅ Also correct - Light gray with dark variant
<div className="bg-gray-50 dark:bg-gray-800">
```

## Tailwind Configuration

The project uses **Tailwind CSS v4** with PostCSS:

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',  // Uses .dark class on <html>
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
}
```

Colors are defined in `index.css` using `@theme` directive:

```css
@theme {
  --color-primary-500: #3b82f6;
  /* ... more colors */
}
```

## Troubleshooting

### Issue: Dark mode not applying

**Check:**
1. Is `dark` class on `<html>`? → `document.documentElement.classList.contains('dark')`
2. Are you using `dark:` variants? → All colors need both light and dark
3. Is localStorage correct? → Check `localStorage.getItem('darkMode')`

### Issue: Colors hardcoded

**Fix:** Replace all instances of:
```tsx
// Before
className="bg-gray-800 text-white"

// After
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

### Issue: Components appear dark in light mode

**Common causes:**
- Hardcoded dark background without `dark:` prefix
- Missing light mode variant
- Wrong conditional logic (using ternary instead of classes)

**Solution:**
```tsx
// ❌ Wrong
<div className={darkMode ? 'bg-gray-800' : 'bg-white'}>

// ✅ Correct
<div className="bg-white dark:bg-gray-800">
```

## Credits

This implementation is inspired by:
- **[Darkmode.js](https://github.com/sandoche/Darkmode.js)** by Sandoche Adittane (MIT License)
- Tailwind CSS dark mode documentation
- React best practices for theme management

## License

MIT License - See project root LICENSE file

---

**Last Updated:** November 5, 2025
**Version:** 2.0.0

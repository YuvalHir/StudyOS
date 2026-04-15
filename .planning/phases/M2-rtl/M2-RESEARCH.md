# Phase M2: Hebrew RTL + i18n - Research

**Researched:** 2026-04-14
**Domain:** Hebrew RTL Support & i18next
**Confidence:** HIGH

## Summary

This phase implements foundational Hebrew RTL (Right-to-Left) support for StudyOS v2. The strategy revolves around using the HTML `dir` attribute combined with modern CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`) to handle direction changes automatically. For translation and direction detection, we use `i18next` with a custom React hook to sync the document root. To maintain a clean Apple-like aesthetic, we use high-quality Hebrew typography (Heebo), prioritize Western Arabic numerals (0-9), and only mirror icons with directional intent (e.g., arrows).

**Primary recommendation:** Use the `dir` attribute on the `<html>` element and strictly enforce CSS Logical Properties across the codebase. Implement a `useLanguageDir` hook to keep the document root synchronized with the `i18next` state.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| M2-RTL-01 | Implement i18next with Hebrew and English locales | `i18next` is already installed and basic setup exists in `apps/web/src/i18n.ts`. |
| M2-RTL-02 | Automatic direction detection and manual toggle | Apple's guidelines recommend mirroring based on language. `Layout.tsx` already has a basic toggle. |
| M2-RTL-03 | Convert CSS to logical properties | Research confirms modern browser support for `inline` and `block` properties. |
| M2-RTL-04 | Add Hebrew font (Heebo) | Heebo is already linked in `index.html` and is the recommended open-source alternative to SF Pro Hebrew. |
| M2-RTL-05 | Implement directional icon flipping logic | Apple's SF Symbols logic should be mirrored: flip arrows/chevrons, keep media/checkmarks/clocks. |
| M2-RTL-06 | Apple-like typography balance | Apple recommends a slightly larger line-height (~1.5) for Hebrew to handle vertical characters and prevent crowding. |
| M2-RTL-07 | Standards for mixed Bi-di text | `unicode-bidi: isolate` is the modern standard for preventing punctuation "jumping" in mixed text. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `i18next` | 23.16.8 | Core translation framework | Industry standard, robust plugin system. |
| `react-i18next` | 14.1.3 | React integration | Official hooks (`useTranslation`) for i18next. |
| `i18next-browser-languagedetector` | 7.2.2 | Detect user's language | Automatically detects Hebrew/English from browser settings. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Intl.DateTimeFormat` | Native | Date/time localization | Handles complex Hebrew months/years correctly (e.g., `he-IL`). |
| `Intl.NumberFormat` | Native | Number/currency localization | Consistent Hebrew numerals and formatting. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Logical Properties | `postcss-rtlcss` | `rtlcss` generates separate files. Logical properties are natively supported and more maintainable. |
| Heebo | Rubik / Assistant | Heebo has 9 weights and is the most "Apple-like" in its geometric construction. |

**Installation:**
Already installed in `apps/web/package.json`.

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── src/
│   ├── i18n.ts             # i18next initialization
│   ├── hooks/
│   │   └── useLanguageDir.ts # Custom hook to sync <html dir="...">
│   ├── locales/
│   │   ├── en.json         # English translations (LTR)
│   │   └── he.json         # Hebrew translations (RTL)
│   └── components/
│       └── Layout.tsx      # Main wrapper using useLanguageDir
```

### Pattern 1: `useLanguageDir` Hook
**What:** Syncing the `dir` attribute on `<html>` with the current language.
**When to use:** In the top-level `Layout` or `App` component.
**Example:**
```typescript
// apps/web/src/hooks/useLanguageDir.ts
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useLanguageDir = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.dir(); // Automatically 'rtl' for 'he', 'ltr' for 'en'
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language]);

  return i18n.dir();
};
```

### Pattern 2: Icon Mirroring Wrapper
**What:** Mirror only icons with directional meaning (back/forward arrows, bicycles).
**When to use:** In a shared `Icon` component.
**Example:**
```tsx
const DirectionalIcon = ({ icon: Icon, mirror = true }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  return (
    <div style={{ transform: isRTL && mirror ? 'scaleX(-1)' : 'none', display: 'inline-flex' }}>
      <Icon />
    </div>
  );
};
```

### Anti-Patterns to Avoid
- **Hardcoding `left` and `right`:** Layout breaks when direction changes. Use `inline-start` and `inline-end`.
- **Flipping Media Controls:** Play/Pause buttons and timelines should ALWAYS be LTR.
- **Flipping Numbers:** Numbers in Hebrew are written LTR. Use Western Arabic numerals (0-9).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date Formatting | Custom string manipulation | `Intl.DateTimeFormat` | Handles complex Hebrew date structures and relative time natively. |
| Number Formatting | `.toLocaleString()` | `Intl.NumberFormat` | Standardized locale support across browsers. |
| RTL Layout Generation | Manual CSS overriding | CSS Logical Properties | Built-in browser support; single-file maintenance. |

## Common Pitfalls

### Pitfall 1: Punctuation "Jumping"
**What goes wrong:** Punctuation at the end of a mixed English/Hebrew string appears at the "wrong" side (e.g., "Hello שלום!" becomes "!Hello שלום").
**Why it happens:** The Unicode Bidi algorithm sees the neutral punctuation and misplaces it.
**How to avoid:** Use `unicode-bidi: isolate` on the container or wrap English snippets in `<span dir="ltr">`.

### Pitfall 2: Too Tight Line-Height for Hebrew
**What goes wrong:** Hebrew characters (especially with diacritics) can overlap or look crowded.
**Why it happens:** Hebrew characters are visually "taller" than Latin characters.
**How to avoid:** Use a slightly larger `line-height` (e.g., `1.5` or `1.6`) for blocks containing Hebrew.

### Pitfall 3: Flipping Brand Logos or Status Icons
**What goes wrong:** Flipping icons like a "Checkmark" or "Clock" makes them look backwards.
**Why it happens:** These symbols are universal and do not imply movement direction.
**How to avoid:** Explicitly disable mirroring for these icons.

## Code Examples

### Logical Properties Cheat Sheet
```css
/* ❌ Physical */
.sidebar {
  margin-left: 20px;
  padding-right: 10px;
  border-left: 1px solid silver;
  text-align: left;
  left: 0;
}

/* ✅ Logical */
.sidebar {
  margin-inline-start: 20px;
  padding-inline-end: 10px;
  border-inline-start: 1px solid silver;
  text-align: start;
  inset-inline-start: 0;
}
```

### Apple-like Typography Balance
```css
/* apps/web/src/index.css */
[lang="he"] body {
  font-family: 'Heebo', sans-serif;
  font-size: 1.125rem; /* ~2pt increase for balance */
  line-height: 1.5;
  letter-spacing: normal; /* Hebrew doesn't like tracking */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `left`/`right` | Logical Properties | 2021-2023 | Native support in all major browsers. |
| `direction: rtl` | `dir="rtl"` attribute | Recent | Better accessibility and cleaner CSS. |
| Generating 2 CSS files | One logical CSS file | 2022+ | Simplified build pipeline. |

## Open Questions

1. **How should we handle icon mirroring globally?**
   - Recommendation: Create a shared `<Icon />` component in `@studyos/ui` that accepts a `mirror` prop.
2. **Should we use `Heebo` for both English and Hebrew?**
   - Recommendation: Yes, Heebo is designed for both and maintains a consistent geometric look similar to SF Pro.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `i18next` | Translation | ✓ | 23.16.8 | — |
| `react-i18next` | Translation | ✓ | 14.1.3 | — |
| `Heebo Font` | Typography | ✓ | Google Fonts | Arial Hebrew |
| `node` | Runtime | ✓ | 24.14.1 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Not installed) |
| Config file | `apps/web/vitest.config.ts` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| M2-RTL-02 | Toggle language updates `dir` | Integration | `vitest apps/web/src/components/Layout.test.tsx` | ❌ Wave 0 |
| M2-RTL-05 | Arrows flip in RTL | Unit | `vitest packages/ui/src/components/Icon.test.tsx` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `vitest` + `@testing-library/react` — Need to install.
- [ ] `apps/web/vitest.config.ts` — Need to create.
- [ ] `apps/web/src/components/Layout.test.tsx` — Test for direction sync.

## Sources

### Primary (HIGH confidence)
- Apple Human Interface Guidelines - Right-to-Left (https://developer.apple.com/design/human-interface-guidelines/foundations/right-to-left/)
- MDN Web Docs - CSS Logical Properties (https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- i18next Documentation - `dir()` method (https://www.i18next.com/overview/api#dir)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries already installed.
- Architecture: HIGH - Logical properties and i18next are industry standards.
- Pitfalls: MEDIUM - Bidi text rendering remains complex and requires manual audit.

**Research date:** 2026-04-14
**Valid until:** 2026-10-14

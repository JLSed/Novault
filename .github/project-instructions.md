# GitHub Copilot Instructions for NoVault

## Project Overview

NoVault is a secure cloud storage solution with zero-knowledge encryption built with:

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Rust/WebAssembly** for client-side encryption (AES-256-GCM)

---

## Code Organization Rules

### Components

1. **Always place reusable components in the `components/` folder.**
2. **Before creating a new component, check if it already exists in `components/`.** If it does, use the existing component instead of creating a new one.
3. Use the `@/` path alias for imports (e.g., `import { Button } from "@/components/Button"`).

### Functions & Utilities

4. **Before creating a function, evaluate if it will be reused.** Don't implement one-time use functions as separate utilities.
5. **Always perform a global search first** to check if the function you want to create already exists. Use existing functions instead of re-implementing them.
6. Place reusable utility functions in a `lib/` or `utils/` folder.

---

## Styling Guidelines

### Tailwind CSS & globals.css

7. **Always use colors defined in `globals.css`.** Do not use arbitrary color values.
8. **If a new color is needed, add it to `globals.css`** under the `:root` or `@theme inline` block first.
9. Current color palette:
   - `--background`: Light `#ffffff` / Dark `#0a0a0a`
   - `--foreground`: Light `#171717` / Dark `#ededed`
10. Use CSS variables via Tailwind: `bg-background`, `text-foreground`, etc.
11. Prefer Tailwind utility classes over inline styles.

---

## WebAssembly / Rust Guidelines

12. Rust/WASM code is located in `rust/src/`.
13. Build WASM with: `npm run build:wasm`
14. WASM output is in `pkg/` folder and can be imported in TypeScript.
15. Use WASM for cryptographic operations to ensure client-side zero-knowledge encryption.

---

## File Structure Conventions

```
app/              # Next.js App Router pages and layouts
components/       # Reusable React components
lib/              # Utility functions and helpers (create if needed)
pkg/              # Compiled WebAssembly output
rust/             # Rust source code for WASM
public/           # Static assets
```

---

## TypeScript Conventions

16. Use strict TypeScript (`strict: true` is enabled).
17. Define proper types/interfaces for all props and data structures.
18. Use the `@/*` path alias for clean imports.

---

## Best Practices

19. Follow React 19 best practices and use Server Components where appropriate.
20. Keep components small and focused on a single responsibility.
21. Use meaningful, descriptive names for components, functions, and variables.
22. Document complex logic with comments.
23. Ensure all user data encryption happens client-side using the WASM module.

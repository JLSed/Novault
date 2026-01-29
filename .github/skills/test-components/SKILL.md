# Test Components Skill

This skill provides guidelines for creating test components in the NoVault project. Test components are minimal UI components designed to test the functionality of specific features.

## When to Use

Trigger this skill when the user requests:

- "create a new test component"
- "add a test component for..."
- "make a testing component"
- "create a component to test..."

## Location

All test components must be placed in:

```
components/test/
```

## Template Structure

Every test component must follow this template:

```tsx
"use client";

import { useState } from "react";

interface TestComponentNameProps {
  // Define props as needed
}

export default function TestComponentName({
  ...props
}: TestComponentNameProps) {
  // State and logic here

  return (
    <div className="w-full max-w-md p-4 border border-foreground/20 rounded">
      <h1 className="text-xl font-bold mb-4">Testing: [Feature Name]</h1>

      <div className="flex flex-col gap-3">
        {/* Minimal UI for testing functionality */}
      </div>
    </div>
  );
}
```

## Design Rules

1. **Header**: Always include an `h1` with text "Testing: [Feature Name]"
2. **Container**: Wrap content in a bordered container using `border border-foreground/20 rounded`
3. **Minimal styling**: Keep the design simple - the goal is to test functions, not look pretty
4. **Max width**: Use `max-w-md` for consistent sizing
5. **Padding**: Use `p-4` for the container
6. **Gap spacing**: Use `gap-3` for element spacing

## Styling Classes

Use these consistent classes:

| Element          | Classes                                                                               |
| ---------------- | ------------------------------------------------------------------------------------- |
| Container        | `w-full max-w-md p-4 border border-foreground/20 rounded`                             |
| Header           | `text-xl font-bold mb-4`                                                              |
| Input            | `border border-foreground/20 p-2 rounded text-foreground bg-background`               |
| Primary Button   | `flex-1 bg-foreground text-background p-2 rounded cursor-pointer disabled:opacity-50` |
| Secondary Button | `px-4 py-2 border border-foreground/20 rounded cursor-pointer`                        |
| Success Result   | `p-3 rounded bg-green-100 text-green-800 text-sm`                                     |
| Error Result     | `p-3 rounded bg-red-100 text-red-800 text-sm`                                         |
| Code Display     | `text-xs break-all bg-green-200 p-1 rounded`                                          |

## Required Features

1. **Console logging**: Add `console.log` statements for debugging:

   ```tsx
   console.log("[ComponentName] Starting operation:", params);
   console.log("[ComponentName] Operation successful");
   console.error("[ComponentName] Error:", error);
   ```

2. **Loading states**: Show loading feedback on buttons:

   ```tsx
   {
     loading ? "Loading..." : "Action";
   }
   ```

3. **Clear/Reset button**: Include a way to reset the component state when results are shown

4. **Error handling**: Display errors in a red-styled result box

## Example Components

See existing test components for reference:

- `components/test/VerifyMasterKey.tsx`
- `components/test/MasterKeyDeriver.tsx`

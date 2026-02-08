# Shadcn/UI Instruction Guide

This project uses **Shadcn/UI** for the Admin Panel (`admin-panel/`).
This guide tells the AI Agent how to construct correct commands and usage patterns.

## 1. Installation & Adding Components

All commands must be run from the `admin-panel/` directory.

### Add a specific component
Use this pattern to install accessible components:

```bash
cd admin-panel
npx shadcn@latest add [component-name]
```

**Common Components:**
- `button`
- `card`
- `dialog` (Modals)
- `form` (React Hook Form wrapper)
- `input`
- `select`
- `table` (Data Table)
- `toast` (Notifications)

### Add multiple components
```bash
npx shadcn@latest add button card input label
```

## 2. Usage Patterns

### Toast Notifications
The toast system requires a specific import path.

**Import:**
```typescript
import { useToast } from "@/hooks/use-toast"
```

**Usage:**
```typescript
const { toast } = useToast()

toast({
  title: "Success",
  description: "Operation completed successfully.",
  variant: "default", // or "destructive"
})
```

**Legacy Adapter:**
If refactoring code that expects `showToast(title, type)`, use this adapter:
```typescript
const { toast } = useToast()

const showToast = (title: string, type: 'success' | 'error' = 'success') => {
    toast({
        title,
        variant: type === 'error' ? 'destructive' : 'default',
    })
}
```

## 3. Best Practices

- **Do Not Modify** `components/ui/*` manually unless necessary. These are "owned" by the installation.
- **Import** from `@/components/ui/[component-name]`.
- **Theme:** The theme is controlled via `src/index.css` (Tailwind variables).

## 4. Troubleshooting

If a component fails to install:
1. Verify `components.json` exists in `admin-panel/`.
2. Ensure you are in the `admin-panel` CWD.
3. Try standard `npm install` first.

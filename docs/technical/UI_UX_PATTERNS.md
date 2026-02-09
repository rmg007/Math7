# UI/UX Patterns & Guidelines

## 1. Authentication & Security

### 1.1 Password Visibility Toggle
**Requirement**: All password input fields (Login, Register, Reset Password) MUST verify a "Show/Hide" toggle button.

**Why**:
- Reduces user frustration and login failures due to typos.
- Aligns with modern UX standards (NIST Digital Identity Guidelines).

**Implementation Pattern**:
```tsx
<div className="relative">
  <Input 
    type={showPassword ? "text" : "password"} 
    className="pr-10" // Space for the button
  />
  <Button
    variant="ghost"
    size="sm"
    className="absolute right-0 top-0 h-full px-3 py-2"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <EyeOff /> : <Eye />}
  </Button>
</div>
```

**Testing Requirement**:
Every password field implementation MUST describe a test case verifying the toggle functionality:
```typescript
fireEvent.click(toggleButton);
expect(passwordInput.getAttribute('type')).toBe('text');
```

---

## 2. Forms & Validation
(Future patterns to be added here)

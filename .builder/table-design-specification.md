# Table Design Specification: Subjects Management

## Current State Analysis

### Structural Issues

**Column Layout:**
- Title (30% width)
- Slug (18% width)
- Icon (10% width)
- Order (8% width)
- Status (15% width)
- Actions (19% width)

**Issues:**
- ❌ Title column too wide for admin context
- ❌ Icon column unnecessary (visual clutter)
- ❌ Order column poorly utilized (single digit)
- ❌ No selection/checkbox for bulk actions
- ⚠️ 6 columns = moderate complexity

### Typography Violations

**Current:**
```
Table Headers:
- text-2xs (10px) ← TOO SMALL, unreadable
- font-semibold
- uppercase ← WRONG CASE
- tracking-widest (0.05em)
- text-gray-400

Table Body:
- text-base (16px) for title ← TOO LARGE, inconsistent
- text-2xs (10px) for slug ← acceptable for code
```

**Design System Expectation:**
```
Headers should be: caption (12px) or sm (14px), normal case, semibold
Body should be: sm (14px) for primary content, xs (12px) for secondary
```

### Color Violations

**Current:**
- Headers: gray-400 (#a0aec0) on gray-50/50 ← LOW CONTRAST
- Borders: gray-200/50 ← too transparent
- Hover: indigo-50/20 ← wrong primary color, insufficient contrast
- Sortable icons: purple-600 ← wrong color, should be teal

**Expected:**
- Headers: gray-600 (#4a5568) minimum for 4.5:1 contrast
- Borders: gray-200 (#e2e8f0) or gray-300 (#cbd5e0)
- Hover: teal-50 (#f0fdfa) or neutral-100 (#edf2f7)
- Primary accent: teal-600 (#319795)

### Spacing Issues

**Current:**
```
Table row height: py-4 (16px padding) = 48px total ← acceptable but tight
Table cell padding: px-6 (24px) = generous horizontal ← ok
Header height: h-12 (48px) ← too short for 10px text
Status badge: py-1 (4px) ← too tight
Icon cell: w-10 h-10 (40px) ← inconsistent
Order cell: w-8 h-8 (32px) ← too small
```

**Expected (4px base unit):**
```
Row height: 44-48px minimum (design system uses 12 unit = 48px)
Header padding: py-3 px-6 (12px vertical, 24px horizontal)
Header height: h-11 or h-12 (44-48px)
Cell padding: py-4 px-6 (16px vertical, 24px horizontal)
Hover background: should not reduce readability
```

### Interactive States

**Current Issues:**
1. ❌ **Hover State**: Very subtle (indigo-50/20) - hard to perceive
2. ❌ **Sort Indicator**: Purple arrow (wrong color)
3. ⚠️ **Action Buttons**: 36px (too small), should be 40px minimum
4. ❌ **Status Badges**: Uppercase (poor UX)
5. ❌ **No visual feedback** for sorted column (just icon change)
6. ❌ **No focus state** on sortable headers for keyboard users

### Accessibility Audit

**Color Contrast (WCAG AA = 4.5:1 minimum):**
- ❌ gray-400 on gray-50: ~3:1 (FAILS)
- ❌ indigo-50/20 hover: insufficient contrast for row visibility
- ✅ Emerald/blue status badges: good contrast
- ✅ Body text: adequate contrast

**Keyboard Navigation:**
- ⚠️ Sortable headers are buttons (good) but visual focus not clear
- ✅ Icon buttons have proper focus
- ⚠️ No way to select/navigate table with keyboard

**Screen Reader:**
- ❌ No table summary or caption
- ❌ Column headers lack scope attributes
- ❌ Status badges lack aria-label
- ❌ Icon column ("NONE" placeholder) has poor semantics
- ✅ Action buttons have accessible icons

### Mobile Responsiveness

**Current Issues:**
- ❌ 6 columns don't fit on mobile (320px-768px)
- ❌ Horizontal scroll required
- ❌ Action buttons hard to tap on small screens
- ❌ Text size inconsistency

---

## Desired Table State

### Data Density & Admin Context

**Goal:** Pack maximum useful information while maintaining scannability.

**Recommended Columns (in priority order):**
1. **Title** (primary identifier) - 35%
2. **Slug** (secondary identifier) - 20%
3. **Status** (critical state) - 15%
4. **Order** (operational) - 12%
5. **Actions** (18%)

**Rationale:**
- Remove icon column (nice-to-have, can be in detail view)
- Prioritize identifier + state + operations
- Better data density
- Easier mobile adaptation

### Color System Alignment

**Headers:**
- Background: transparent (match body background)
- Text: gray-700 (#2d3748) - teal-600 (#319795) for sortable
- Border: gray-200 (#e2e8f0)

**Body:**
- Text: gray-900 (#1a202c) primary, gray-600 (#4a5568) secondary
- Hover: neutral-100 (#edf2f7) background (12px padding = 48px total height maintained)
- Border: gray-200 (#e2e8f0)
- Focus: teal ring (3px, teal-600)

**Sortable Indicators:**
- Active sort: teal-600 (#319795)
- Inactive sort: gray-400 (#a0aec0)

**Status Badges:**
- Keep semantic colors (emerald, blue, amber, red)
- Simplify styling (remove uppercase, reduce border-radius)
- Add subtle background

### Typography Alignment

**Headers (TableHead):**
- Font size: sm (14px) or caption (12px) + 4px letter-spacing
- Font weight: semibold (600)
- Case: Normal (Title Case for column names)
- Color: gray-700 or teal-600 (for sortable)
- Line height: none (1)

**Body (TableCell):**
- Primary text (title): base (16px), semibold (600), gray-900
- Secondary text (slug): sm (14px), normal (400), gray-600, monospace
- Tertiary text (order): xs (12px), medium (500), gray-500
- Status badge: xs (12px), semibold (600), semantic colors

**Sortable Button:**
- Inherit header styling
- Hover: gray-900 (not teal!)
- Active: teal-600 + underline or background

### Spacing

**Row Height:**
```
Header row: py-3 (12px) = 44px total (matches design system)
Body row: py-3 (12px) = 44px total (compact but readable)
```

**Cell Padding:**
```
First column: pl-6, py-3
Middle columns: px-4, py-3  
Last column: pr-6, py-3
Allows 24px outer, 16px between
```

**Gaps:**
- Status badge padding: px-2 py-1 (8px, 4px)
- Icon spacing: 8px gaps

### Interactive States

**Hover Row:**
- Background: neutral-100 (#edf2f7) at 100% opacity (not transparent)
- Action buttons: show/emphasize on hover
- Transition: smooth 150ms

**Focus State (Keyboard):**
- 3px teal-600 ring around focused element
- Outline offset: 2px

**Sorted Column:**
- Row 1: Teal icon (active sort)
- Row 2-N: Gray icon (available to sort)
- Visual indicator: Subtle background or left border on sorted column header

**Loading State:**
- Skeleton rows with subtle animation
- Clear "Loading..." text

**Empty State:**
- Centered in table area
- Clear call-to-action
- Icon + heading + description

### Mobile Behavior (< 768px)

**Option 1: Reduced Columns**
- Show: Title, Status, Actions
- Hide: Slug, Order
- Collapse Actions to single "..." menu

**Option 2: Card Layout**
- Switch to card grid layout
- Each card shows: Title, Slug, Status, Order
- Bottom action buttons

**Option 3: Horizontal Scroll (Recommended)**
- Keep table but allow horizontal scroll
- Ensure first column (Title) is sticky
- Adjust column widths for small screens

---

## Implementation Plan

### Phase 1: Column Restructuring
- [ ] Remove Icon column
- [ ] Reorder: Title, Slug, Status, Order, Actions
- [ ] Adjust column width percentages
- [ ] Update table header markup

### Phase 2: Color System Overhaul
- [ ] Update header color to gray-700 (primary) / teal-600 (sortable)
- [ ] Update hover state to neutral-100
- [ ] Update border to gray-200
- [ ] Update sort icons to teal-600
- [ ] Update body text colors (gray-900 primary, gray-600 secondary)

### Phase 3: Typography
- [ ] Change header font size from 2xs → sm (14px)
- [ ] Remove uppercase from headers → Title Case
- [ ] Update header weight and spacing
- [ ] Ensure body text hierarchy (base/sm/xs)
- [ ] Remove italic formatting from title

### Phase 4: Spacing & Height
- [ ] Standardize row height to 44px (py-3)
- [ ] Update header height to 44px
- [ ] Standardize cell padding: px-6 py-3 (first), px-4 py-3 (middle), px-6 py-3 (last)
- [ ] Update status badge padding

### Phase 5: Status Badge Redesign
- [ ] Remove uppercase
- [ ] Simplify styling (less border-radius)
- [ ] Keep semantic colors
- [ ] Better padding

### Phase 6: Interactive States
- [ ] Update hover background to neutral-100
- [ ] Add focus state styling (3px ring)
- [ ] Update sortable header indicators
- [ ] Add visual feedback for active sort

### Phase 7: Accessibility
- [ ] Add aria-sort attributes to headers
- [ ] Add table summary/caption
- [ ] Add aria-label to status badges
- [ ] Fix color contrast ratios
- [ ] Test keyboard navigation

### Phase 8: Mobile Responsive
- [ ] Add media queries for mobile behavior
- [ ] Make columns sticky/hide non-essential
- [ ] Adjust touch targets (44px minimum)
- [ ] Test on 320px, 480px, 768px breakpoints

---

## Code Changes Summary

### Files to Modify:
1. `SubjectsPage.tsx` - SubjectRow component
2. `SortableHeader.tsx` - Header component styling
3. Possibly `table.tsx` - Update base table styles

### Key Changes:

**SubjectRow:**
```
- Remove TableCell for icon_url
- Reorder columns: Title, Slug, Status, Order, Actions
- Update className: colors, spacing, hover state
- Update text styling: case, weight, size
```

**SortableHeader:**
```
- Update icon color: purple → teal
- Update button styles: color, hover state
- Add focus ring
- Add aria-sort attribute
```

**Table Headers:**
```
- Change from text-2xs uppercase → sm normal-case
- Update color: gray-400 → gray-700 or teal-600
- Adjust padding and height
- Remove tracking-widest (if normal case)
```

---

## Success Criteria

- ✅ Column restructured (5 columns instead of 6)
- ✅ 100% brand color alignment (teal primary)
- ✅ Typography matches design system exactly
- ✅ Spacing aligned to 4px unit base
- ✅ WCAG AA color contrast minimum 4.5:1
- ✅ Clear hover state (12px+ change)
- ✅ Clear focus state (3px ring)
- ✅ Keyboard navigation works
- ✅ Mobile responsive (tested at 3 breakpoints)
- ✅ Loading state clear
- ✅ Empty state clear
- ✅ All interactive states (sort, hover, focus) visible and functional

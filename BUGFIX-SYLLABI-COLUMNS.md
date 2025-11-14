# 🐛 Bug Fix: Syllabi Table Column References

## Issue
Error: `column syllabi_1.category does not exist`

The enrollment pages were referencing a `category` column that doesn't exist in the `syllabi` table.

## Root Cause
The `syllabi` table schema uses:
- `code` - Short code like "PPC", "IRA", "CPC"
- `target_certificate` - Target like "private", "instrument", "commercial"  
- `faa_type` - Full type like "Private Pilot", "FAA 141", "Part 61"

But the new enrollment code was trying to use `category` which doesn't exist.

## Files Fixed

### 1. `app/admin/enrollments/page.tsx`
**Changed:**
```typescript
// OLD - Wrong column
syllabus:syllabus_id (
  id,
  title,
  category,  // ❌ Doesn't exist
  faa_type
)

// NEW - Correct columns
syllabus:syllabus_id (
  id,
  title,
  faa_type,
  target_certificate,
  code
)
```

### 2. `app/admin/enrollments/enrollment-dashboard.tsx`
**Changed:**
```typescript
// OLD - Assumed category existed
const syllabusCounts = syllabi.map(syllabus => ({
  ...syllabus,
  count: activeEnrollments.filter(e => e.syllabus?.id === syllabus.id).length
}))

// NEW - Creates category from available fields
const syllabusCounts = syllabi.map(syllabus => {
  const category = syllabus.code || syllabus.target_certificate || syllabus.faa_type || 'Other'
  return {
    ...syllabus,
    category: category.toUpperCase(),
    count: activeEnrollments.filter(e => e.syllabus?.id === syllabus.id).length
  }
})
```

### 3. `app/admin/enrollments/enrollment-card.tsx`
**Changed:**
```typescript
// OLD
<span className="font-medium">{syllabus?.category || 'N/A'}</span>

// NEW - Fallback chain
<span className="font-medium">
  {syllabus?.code || syllabus?.target_certificate || syllabus?.faa_type || 'N/A'}
</span>
```

### 4. `app/admin/enrollments/enrollment-approval-dialog.tsx`
**Changed:**
- Updated syllabi query to select correct columns
- Added fallback logic for displaying category
- Fixed dropdown options to show `code - title` format

### 5. `app/api/admin/enrollments/approve/route.ts`
**Changed:**
```typescript
// Updated syllabus query to use correct columns
syllabus:syllabi(
  id,
  title,
  faa_type,
  code
)
```

## Display Logic
Uses a fallback pattern for displaying the program category:
```typescript
const category = code || target_certificate || faa_type || 'Other'
```

This ensures:
1. **Shortest/clearest value first** - "PPC" instead of "Private Pilot"
2. **Graceful fallback** - If no code, use target_certificate
3. **Always shows something** - Falls back to faa_type or 'Other'

## Examples
Based on actual data:
- "PPC" (from code) → displays as "PPC"
- "private" (from target_certificate) → displays as "PRIVATE"
- "Private Pilot" (from faa_type) → displays as "PRIVATE PILOT"

## Testing
✅ Page loads without errors
✅ Syllabus count cards display correctly
✅ Enrollment cards show program info
✅ Approval dialog dropdown works
✅ All fallback logic functional

## Status
🟢 **FIXED** - All pages now use correct syllabi table columns


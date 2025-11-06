# Table Styling Reference Guide

## 🎨 Standard Table Pattern

Use this pattern for all tables in the application to maintain consistency and readability.

### Basic Table Structure

```tsx
<div className="glass dark:glass-dark rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
  <div className="overflow-x-auto">
    <table className="w-full">
      {/* Header */}
      <thead className="bg-gray-800 dark:bg-gray-900">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider">
            Column Name
          </th>
        </tr>
      </thead>
      
      {/* Body */}
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <tr className="hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
          <td className="px-6 py-4">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Primary Data
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  {/* Footer (optional) */}
  <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
      Footer content
    </p>
  </div>
</div>
```

## 🎨 Color Classes Reference

### Table Headers
```tsx
className="bg-gray-800 dark:bg-gray-900"  // Background
className="text-gray-100 dark:text-gray-200"  // Text
```

### Table Body
```tsx
className="bg-white dark:bg-gray-800"  // Background
className="text-gray-900 dark:text-gray-100"  // Primary text
className="text-gray-600 dark:text-gray-400"  // Secondary text
className="text-gray-500 dark:text-gray-400"  // Icons
```

### Hover States
```tsx
// Generic hover
className="hover:bg-blue-50 dark:hover:bg-gray-700"

// Orders page
className="hover:bg-blue-50 dark:hover:bg-gray-700"

// Products page
className="hover:bg-green-50 dark:hover:bg-gray-700"

// Users page
className="hover:bg-purple-50 dark:hover:bg-gray-700"
```

### Table Footer
```tsx
className="bg-gray-100 dark:bg-gray-800"  // Background
className="text-gray-700 dark:text-gray-300"  // Text
```

## 📋 Cell Content Patterns

### Primary Data (Names, IDs)
```tsx
<span className="text-sm font-bold text-gray-900 dark:text-gray-100">
  {data}
</span>
```

### Secondary Data (References, Descriptions)
```tsx
<span className="text-xs text-gray-600 dark:text-gray-400">
  {data}
</span>
```

### Icons with Text
```tsx
<div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-200">
  <MdIcon className="text-gray-500 dark:text-gray-400" />
  {data}
</div>
```

### Badges (Status, Priority, Role)
```tsx
// Keep existing badge colors - they already have good contrast
<span className="px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full bg-yellow-100 text-yellow-800">
  Status
</span>
```

## 🎯 Context-Specific Hover Colors

Choose hover color based on page context:

- **Orders**: `hover:bg-blue-50 dark:hover:bg-gray-700` (Blue theme)
- **Products**: `hover:bg-green-50 dark:hover:bg-gray-700` (Green theme)
- **Users**: `hover:bg-purple-50 dark:hover:bg-gray-700` (Purple theme)
- **Dashboard**: `hover:bg-blue-50 dark:hover:bg-gray-700` (Blue theme)

## ✅ Accessibility Guidelines

### Contrast Ratios (WCAG AAA)
- **Headers**: Dark bg (gray-800/900) + Light text (gray-100/200) = 7:1+ ratio
- **Body**: White/dark bg + Dark/light text (gray-900/100) = 16:1+ ratio
- **Secondary**: Medium bg + Medium text = 4.5:1+ ratio

### Text Hierarchy
1. **Primary** (names, IDs): `text-gray-900 dark:text-gray-100` - Boldest
2. **Secondary** (details): `text-gray-600 dark:text-gray-400` - Medium
3. **Tertiary** (icons): `text-gray-500 dark:text-gray-400` - Lightest

## 🚫 What to Avoid

### ❌ Don't Use
```tsx
// Poor contrast - too light
className="bg-gray-50 dark:bg-gray-800/50"
className="text-gray-500 dark:text-gray-400"  // for primary text

// Gradient headers (hard to read)
className="bg-gradient-to-r from-gray-50 to-gray-100"

// Semi-transparent backgrounds
className="dark:bg-gray-800/50"

// Inconsistent patterns
className="bg-white"  // without dark mode variant
```

### ✅ Do Use
```tsx
// Good contrast - dark headers
className="bg-gray-800 dark:bg-gray-900"
className="text-gray-100 dark:text-gray-200"

// Solid backgrounds
className="bg-white dark:bg-gray-800"

// Proper text hierarchy
className="text-gray-900 dark:text-gray-100"  // primary
className="text-gray-600 dark:text-gray-400"  // secondary
```

## 📱 Responsive Considerations

### Overflow Handling
```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>
```

### Mobile-Friendly Padding
```tsx
// Desktop: px-6, Mobile: Maintains readability
className="px-6 py-4"

// Consider reducing for mobile if needed
className="px-4 sm:px-6 py-4"
```

## 🎨 Complete Example

```tsx
<div className="glass dark:glass-dark rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-800 dark:bg-gray-900">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider">
            Product
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider">
            Details
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <tr className="hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
          {/* Primary data */}
          <td className="px-6 py-4">
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Product Name
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              REF-001
            </div>
          </td>
          
          {/* Badge */}
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800">
              Active
            </span>
          </td>
          
          {/* Icons with text */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-200">
              <MdPerson className="text-gray-500 dark:text-gray-400" />
              John Doe
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
      Showing 10 results
    </p>
  </div>
</div>
```

## 🔄 Quick Migration Guide

If you have an old table using light headers, update it like this:

### Before (Poor Contrast)
```tsx
<thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
  <tr>
    <th className="text-gray-700 dark:text-gray-300">Header</th>
  </tr>
</thead>
<tbody className="divide-y divide-gray-200">
  <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/10">
    <td className="text-gray-700 dark:text-gray-300">Data</td>
  </tr>
</tbody>
```

### After (Good Contrast)
```tsx
<thead className="bg-gray-800 dark:bg-gray-900">
  <tr>
    <th className="text-gray-100 dark:text-gray-200">Header</th>
  </tr>
</thead>
<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
  <tr className="hover:bg-blue-50 dark:hover:bg-gray-700">
    <td className="text-gray-900 dark:text-gray-100">Data</td>
  </tr>
</tbody>
```

## 📚 Additional Resources

- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [shadcn/ui Table Component](https://ui.shadcn.com/docs/components/table)

---

**Last Updated**: Sprint 5 - UI Visibility Improvements
**Maintained By**: Development Team

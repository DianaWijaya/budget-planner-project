export const theme = {
  colors: {
    // Primary brand color (buttons, links, etc.)
    primary: {
      bg: 'bg-brand-500',
      bgHover: 'hover:bg-brand-600',
      text: 'text-brand-600',
      border: 'border-brand-500',
    },
    
    // Income (green)
    income: {
      bg: 'bg-budget-income',
      bgLight: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-500',
    },
    
    // Expense (red)
    expense: {
      bg: 'bg-budget-expense',
      bgLight: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-500',
    },
    
    // Savings (purple)
    savings: {
      bg: 'bg-budget-savings',
      bgLight: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-500',
    },
    
    // Warning/Alert (orange)
    warning: {
      bg: 'bg-budget-warning',
      bgLight: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-500',
    },
    
    // Success
    success: {
      bg: 'bg-green-500',
      bgLight: 'bg-green-50',
      text: 'text-green-700',
    },
    
    // Neutral/Gray
    neutral: {
      bg: 'bg-gray-100',
      bgDark: 'bg-gray-800',
      text: 'text-gray-700',
      textLight: 'text-gray-500',
      border: 'border-gray-300',
    },
  },
  
  // Component Styles (reusable classes)
  components: {
    // Button styles
    button: {
      primary: 'rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      secondary: 'rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
      danger: 'rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
      outline: 'rounded-lg border-2 border-brand-500 bg-transparent px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50',
    },
    
    // Card styles
    card: {
      base: 'rounded-card bg-white shadow-card overflow-hidden',
      hover: 'rounded-card bg-white shadow-card hover:shadow-card-hover transition-shadow overflow-hidden',
      bordered: 'rounded-card bg-white border border-gray-200 overflow-hidden',
    },
    
    // Input styles
    input: {
      base: 'block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
      error: 'block w-full rounded-lg border border-red-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500',
    },
    
    // Badge styles
    badge: {
      income: 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800',
      expense: 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800',
      warning: 'inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800',
      neutral: 'inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800',
    },
  },
  
  // Typography
  typography: {
    // Page headings
    h1: 'text-3xl font-bold font-display text-gray-900',
    h2: 'text-2xl font-bold font-display text-gray-900',
    h3: 'text-xl font-semibold font-display text-gray-900',
    h4: 'text-lg font-semibold text-gray-900',
    
    // Body text
    body: 'text-base text-gray-700',
    bodySmall: 'text-sm text-gray-600',
    bodyTiny: 'text-xs text-gray-500',
    
    // Labels
    label: 'block text-sm font-medium text-gray-700',
    labelSmall: 'block text-xs font-medium text-gray-600',
  },
  
  // Layout
  layout: {
    container: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
    section: 'py-8',
    card: 'p-6',
  },
} as const;

// Combine classes easily
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

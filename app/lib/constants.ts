/**
 * Lucide React icon names for categories
 */
export type IconName = 
  | 'Utensils'
  | 'Home'
  | 'Car'
  | 'Film'
  | 'ShoppingBag'
  | 'Heart'
  | 'Plane'
  | 'BookOpen'
  | 'User'
  | 'Coffee'
  | 'Dumbbell'
  | 'Music'
  | 'Briefcase'
  | 'Phone'
  | 'Laptop';

/**
 * Category configuration type
 */
export interface CategoryConfig {
  name: string;
  color: string;
  icon: IconName;
}

/**
 * Default categories for new users
 */
export const DEFAULT_CATEGORIES: readonly CategoryConfig[] = [
  { name: "Food & Dining", color: "#ef4444", icon: "Utensils" },
  { name: "Housing", color: "#3b82f6", icon: "Home" },
  { name: "Transportation", color: "#f59e0b", icon: "Car" },
  { name: "Entertainment", color: "#a855f7", icon: "Film" },
  { name: "Shopping", color: "#ec4899", icon: "ShoppingBag" },
  { name: "Health", color: "#06b6d4", icon: "Heart" },
  { name: "Travel", color: "#f97316", icon: "Plane" },
  { name: "Education", color: "#8b5cf6", icon: "BookOpen" },
  { name: "Personal Care", color: "#f43f5e", icon: "User" },
] as const;

/**
 * Category color palette - predefined colors users can choose from
 */
export const CATEGORY_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#eab308" },
  { name: "Lime", value: "#84cc16" },
  { name: "Green", value: "#22c55e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
] as const;

/**
 * Available icons for categories
 */
export const CATEGORY_ICONS: readonly IconName[] = [
  "Utensils",
  "Home",
  "Car",
  "Film",
  "ShoppingBag",
  "Heart",
  "Plane",
  "BookOpen",
  "User",
  "Coffee",
  "Dumbbell",
  "Music",
  "Briefcase",
  "Phone",
  "Laptop",
] as const;

/**
 * Transaction frequency options
 */
export const TRANSACTION_FREQUENCIES = [
  { value: "once", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

/**
 * Budget period options
 */
export const BUDGET_PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

/**
 * Export type helpers
 */
export type TransactionFrequency = typeof TRANSACTION_FREQUENCIES[number]['value'];
export type BudgetPeriod = typeof BUDGET_PERIODS[number]['value'];
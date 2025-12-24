import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, useLoaderData, useActionData, useNavigation, useNavigate } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import * as Icons from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * LOADER: Fetch budget and spending for current month
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Fetch budget for current month
  const budget = await prisma.budget.findUnique({
    where: {
      userId_month_year: {
        userId,
        month: currentMonth,
        year: currentYear,
      },
    },
  });
  
  // Calculate dates for current month
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0);
  
  // Fetch total expenses for current month
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      amount: true,
    },
  });
  
  const totalExpenses = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Fetch total income for current month
  const incomes = await prisma.income.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      amount: true,
    },
  });
  
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  
  // Calculate remaining budget
  const budgetAmount = budget?.amount || 0;
  const remaining = budgetAmount - totalExpenses;
  const percentage = budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;
  
  return {
    budget,
    totalIncome,
    totalExpenses,
    budgetAmount,
    remaining,
    percentage,
    currentMonth,
    currentYear,
  };
}

/**
 * ACTION: Create/Update/Delete budget
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get('intent');
  
  // Create or Update budget
  if (intent === 'save-budget') {
    const budgetType = formData.get('budgetType');
    const amount = formData.get('amount');
    const percentage = formData.get('percentage');
    const totalIncome = formData.get('totalIncome');
    const month = formData.get('month');
    const year = formData.get('year');
    const budgetId = formData.get('budgetId');
    
    const errors: any = {};
    let finalAmount = 0;
    
    if (budgetType === 'amount') {
      if (typeof amount !== 'string' || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        errors.amount = 'Amount must be a positive number';
      } else {
        finalAmount = parseFloat(amount);
      }
    } else if (budgetType === 'percentage') {
      if (typeof percentage !== 'string' || isNaN(parseFloat(percentage)) || parseFloat(percentage) <= 0 || parseFloat(percentage) > 100) {
        errors.percentage = 'Percentage must be between 1 and 100';
      } else {
        const income = parseFloat(totalIncome as string);
        if (income <= 0) {
          errors.percentage = 'You need to add income before setting a percentage-based budget';
        } else {
          finalAmount = (income * parseFloat(percentage)) / 100;
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      return { errors };
    }
    
    // Update existing budget
    if (budgetId && typeof budgetId === 'string') {
      await prisma.budget.update({
        where: { id: budgetId },
        data: { amount: finalAmount },
      });
      return { success: 'Budget updated successfully' };
    }
    
    // Create new budget
    await prisma.budget.create({
      data: {
        amount: finalAmount,
        month: parseInt(month as string),
        year: parseInt(year as string),
        userId,
      },
    });
    
    return { success: 'Budget created successfully' };
  }
  
  return { error: 'Invalid action' };
}

/**
 * COMPONENT: Unified Budget Page
 */
export default function BudgetsPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';
  
  const [isEditing, setIsEditing] = useState(!data.budget); // Auto-edit mode if no budget
  const [budgetType, setBudgetType] = useState<'amount' | 'percentage'>('percentage');
  const [percentageValue, setPercentageValue] = useState(80);
  const [amountValue, setAmountValue] = useState('');
  
  // Reset editing mode after successful save
  useEffect(() => {
    if (actionData?.success) {
      setIsEditing(false);
    }
  }, [actionData?.success]);
  
  // Initialize values when editing existing budget
  useEffect(() => {
    if (data.budget && data.totalIncome > 0) {
      const budgetPercentage = (data.budget.amount / data.totalIncome) * 100;
      setPercentageValue(Math.round(budgetPercentage));
    }
    if (data.budget) {
      setAmountValue(data.budget.amount.toString());
    }
  }, [data.budget, data.totalIncome]);
  
  const monthName = new Date(data.currentYear, data.currentMonth - 1).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const calculatedAmount = data.totalIncome > 0 ? (data.totalIncome * percentageValue) / 100 : 0;
  const isOverBudget = data.percentage > 100;
  const isWarning = data.percentage > 80 && data.percentage <= 100;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className={theme.layout.container}>
          <div className="flex h-16 items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className={cn(theme.typography.h4, "text-brand-600 hover:text-brand-700 flex items-center gap-2")}
            >
              <Icons.ArrowLeft className="h-5 w-5" />
              Back
            </button>
            
            {data.budget && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={theme.components.button.primary}
              >
                <Icons.Edit2 className="h-4 w-4 mr-2 inline" />
                Edit Budget
              </button>
            )}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, theme.layout.section)}>
        <div className="mb-6">
          <h1 className={theme.typography.h1}>Monthly Budget</h1>
          <p className={theme.typography.bodySmall}>
            {data.budget ? `Your budget for ${monthName}` : `Set your spending limit for ${monthName}`}
          </p>
        </div>
        
        {/* Messages */}
        {actionData?.success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center gap-2">
              <Icons.CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">{actionData.success}</p>
            </div>
          </div>
        )}
        
        {actionData?.error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2">
              <Icons.AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{actionData.error}</p>
            </div>
          </div>
        )}
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>Total Income</p>
                <Icons.TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className={cn(theme.typography.h2, theme.colors.income.text)}>
                ${data.totalIncome.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>Monthly Budget</p>
                <Icons.Target className="h-5 w-5 text-blue-600" />
              </div>
              <p className={cn(theme.typography.h2, 'text-blue-600')}>
                ${data.budgetAmount.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>Total Spent</p>
                <Icons.TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <p className={cn(theme.typography.h2, theme.colors.expense.text)}>
                ${data.totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>Remaining</p>
                <Icons.Wallet className={cn(
                  "h-5 w-5",
                  data.remaining >= 0 ? "text-green-600" : "text-red-600"
                )} />
              </div>
              <p className={cn(
                theme.typography.h2,
                data.remaining >= 0 ? theme.colors.income.text : theme.colors.expense.text
              )}>
                ${Math.abs(data.remaining).toFixed(2)}
              </p>
              <p className={theme.typography.bodyTiny}>
                {data.remaining >= 0 ? 'Under budget' : 'Over budget'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Budget Progress (if budget exists and not editing) */}
        {data.budget && !isEditing && (
          <div className={cn(theme.components.card.base, "mb-8")}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className={theme.typography.h4}>Budget Progress</h3>
                  <p className={theme.typography.bodyTiny}>
                    ${data.totalExpenses.toFixed(2)} of ${data.budgetAmount.toFixed(2)} spent
                  </p>
                </div>
                {isOverBudget ? (
                  <span className={theme.components.badge.expense}>
                    Over Budget
                  </span>
                ) : isWarning ? (
                  <span className={theme.components.badge.warning}>
                    80%+ Used
                  </span>
                ) : (
                  <span className={theme.components.badge.income}>
                    On Track
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={cn(
                    "h-4 rounded-full transition-all",
                    isOverBudget ? 'bg-red-500' :
                    isWarning ? 'bg-orange-500' :
                    'bg-green-500'
                  )}
                  style={{ 
                    width: `${Math.min(data.percentage, 100)}%` 
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className={theme.typography.bodySmall}>
                  {data.percentage.toFixed(1)}% used
                </span>
                <span className={cn(
                  theme.typography.bodySmall,
                  data.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  ${Math.abs(data.remaining).toFixed(2)} 
                  {data.remaining >= 0 ? ' left' : ' over'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Budget Form (Create/Edit) */}
        {isEditing && (
          <Form method="post" className={theme.components.card.base}>
            <div className={cn(theme.layout.card, "space-y-6")}>
              <div className="flex items-center justify-between">
                <h3 className={theme.typography.h3}>
                  {data.budget ? 'Edit Budget' : 'Set Budget'}
                </h3>
                {data.budget && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              <input type="hidden" name="intent" value="save-budget" />
              <input type="hidden" name="budgetId" value={data.budget?.id || ''} />
              <input type="hidden" name="totalIncome" value={data.totalIncome} />
              <input type="hidden" name="month" value={data.currentMonth} />
              <input type="hidden" name="year" value={data.currentYear} />
              
              {/* Income Info */}
              {data.totalIncome > 0 ? (
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <Icons.Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Your income this month: ${data.totalIncome.toFixed(2)}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Set your budget as a percentage of income or a fixed amount
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <Icons.AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        No income recorded for this month
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        You can still set a fixed budget amount, or add income first to use percentage-based budgets
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Budget Type Selection */}
              <div>
                <label className={theme.typography.label}>
                  Budget Type *
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBudgetType('percentage')}
                    disabled={data.totalIncome === 0}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      budgetType === 'percentage'
                        ? "border-brand-600 bg-brand-50"
                        : "border-gray-200 bg-white hover:border-gray-300",
                      data.totalIncome === 0 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icons.Percent className="h-5 w-5 text-brand-600" />
                      <span className="font-medium">Percentage</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Set as % of income
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setBudgetType('amount')}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      budgetType === 'amount'
                        ? "border-brand-600 bg-brand-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icons.DollarSign className="h-5 w-5 text-brand-600" />
                      <span className="font-medium">Fixed Amount</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Set exact dollar amount
                    </p>
                  </button>
                </div>
                <input type="hidden" name="budgetType" value={budgetType} />
              </div>
              
              {/* Percentage Input */}
              {budgetType === 'percentage' && (
                <div>
                  <label htmlFor="percentage" className={theme.typography.label}>
                    Budget Percentage *
                  </label>
                  <div className="mt-2">
                    <input
                      id="percentage"
                      name="percentage"
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={percentageValue}
                      onChange={(e) => setPercentageValue(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-600">0%</span>
                      <span className="text-lg font-semibold text-brand-600">
                        {percentageValue}%
                      </span>
                      <span className="text-sm text-gray-600">100%</span>
                    </div>
                  </div>
                  {data.totalIncome > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        Your budget will be: <span className="font-semibold text-brand-600">${calculatedAmount.toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        ({percentageValue}% of ${data.totalIncome.toFixed(2)} income)
                      </p>
                    </div>
                  )}
                  {actionData?.errors?.percentage && (
                    <p className="mt-1 text-sm text-red-600">
                      {actionData.errors.percentage}
                    </p>
                  )}
                </div>
              )}
              
              {/* Fixed Amount Input */}
              {budgetType === 'amount' && (
                <div>
                  <label htmlFor="amount" className={theme.typography.label}>
                    Monthly Budget Amount *
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      required={budgetType === 'amount'}
                      placeholder="0.00"
                      value={amountValue}
                      onChange={(e) => setAmountValue(e.target.value)}
                      className={cn(theme.components.input.base, "pl-7")}
                    />
                  </div>
                  {actionData?.errors?.amount && (
                    <p className="mt-1 text-sm text-red-600">
                      {actionData.errors.amount}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Total amount you want to spend this month
                  </p>
                </div>
              )}
              
              {/* Tips */}
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm font-medium text-green-900 mb-2">
                  💡 Budget Tips:
                </p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• <strong>50/30/20 rule:</strong> 50% needs, 30% wants, 20% savings</li>
                  <li>• <strong>80% rule:</strong> Spend 80% of income, save 20%</li>
                  <li>• Leave room for unexpected expenses</li>
                  <li>• You can adjust your budget anytime</li>
                </ul>
              </div>
              
              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting || (budgetType === 'percentage' && data.totalIncome === 0)}
                  className={cn(theme.components.button.primary, "flex-1")}
                >
                  {isSubmitting ? 'Saving...' : data.budget ? 'Update Budget' : 'Set Budget'}
                </button>
                {data.budget && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={theme.components.button.secondary}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </Form>
        )}
        
        {/* Tips (when viewing, not editing) */}
        {!isEditing && data.budget && (
          <div className={cn(theme.components.card.base, "mt-8")}>
            <div className={theme.layout.card}>
              <h3 className={cn(theme.typography.h4, "mb-3")}>
                💡 Budgeting Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Review your budget weekly to stay on track</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Adjust your budget if your spending patterns change</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Save leftover budget money for future months</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Track your spending regularly to avoid overspending</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData, useActionData, useNavigation, useNavigate } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import * as Icons from 'lucide-react';
import { useState } from 'react';

/**
 * LOADER: Check if budget already exists for current month
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Check if budget already exists
  const existingBudget = await prisma.budget.findUnique({
    where: {
      userId_month_year: {
        userId,
        month: currentMonth,
        year: currentYear,
      },
    },
  });
  
  // Get total income for current month to suggest budget
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0);
  
  const incomes = await prisma.income.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  
  return {
    existingBudget,
    totalIncome,
    currentMonth,
    currentYear,
  };
}

/**
 * ACTION: Create new budget
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const budgetType = formData.get('budgetType'); // 'amount' or 'percentage'
  const amount = formData.get('amount');
  const percentage = formData.get('percentage');
  const totalIncome = formData.get('totalIncome');
  const month = formData.get('month');
  const year = formData.get('year');
  
  // Validation
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
  } else {
    errors.budgetType = 'Please select a budget type';
  }
  
  if (typeof month !== 'string' || isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12) {
    errors.month = 'Invalid month';
  }
  
  if (typeof year !== 'string' || isNaN(parseInt(year))) {
    errors.year = 'Invalid year';
  }
  
  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  
  // Check if budget already exists
  const existing = await prisma.budget.findUnique({
    where: {
      userId_month_year: {
        userId,
        month: parseInt(month as string),
        year: parseInt(year as string),
      },
    },
  });
  
  if (existing) {
    return { 
      errors: { 
        amount: 'Budget already exists for this month. Please edit the existing budget instead.' 
      } 
    };
  }
  
  // Create budget
  await prisma.budget.create({
    data: {
      amount: finalAmount,
      month: parseInt(month as string),
      year: parseInt(year as string),
      userId,
    },
  });
  
  return redirect('/budgets');
}

/**
 * COMPONENT: New Budget Form
 */
export default function NewBudgetPage() {
  const { existingBudget, totalIncome, currentMonth, currentYear } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';
  
  const [budgetType, setBudgetType] = useState<'amount' | 'percentage'>('percentage');
  const [percentageValue, setPercentageValue] = useState(80);
  const [amountValue, setAmountValue] = useState('');
  
  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const calculatedAmount = totalIncome > 0 ? (totalIncome * percentageValue) / 100 : 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className={theme.layout.container}>
          <div className="flex h-16 items-center">
            <button 
              onClick={() => navigate(-1)}
              className={cn(theme.typography.h4, "text-brand-600 hover:text-brand-700 flex items-center gap-2")}
            >
              <Icons.ArrowLeft className="h-5 w-5" />
              Back
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, "py-8")}>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h1 className={theme.typography.h1}>Set Monthly Budget</h1>
            <p className={theme.typography.bodySmall}>
              Set your spending limit for {monthName}
            </p>
          </div>
          
          {existingBudget ? (
            /* Budget Already Exists */
            <div className={cn(theme.components.card.base, "text-center py-12")}>
              <Icons.AlertCircle className="mx-auto h-12 w-12 text-orange-400" />
              <h3 className={cn(theme.typography.h3, "mt-4")}>
                Budget already set
              </h3>
              <p className={cn(theme.typography.bodySmall, "mt-2")}>
                You already have a budget of ${existingBudget.amount.toFixed(2)} for {monthName}.
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => navigate(-1)}
                  className={theme.components.button.secondary}
                >
                  Back
                </button>
                <Link
                  to={`/budgets/${existingBudget.id}/edit`}
                  className={theme.components.button.primary}
                >
                  Edit Budget
                </Link>
              </div>
            </div>
          ) : (
            <Form method="post" className={theme.components.card.base}>
              <div className={cn(theme.layout.card, "space-y-6")}>
                {/* Income Info */}
                {totalIncome > 0 ? (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <Icons.Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Your income this month: ${totalIncome.toFixed(2)}
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
                        <Link to="/incomes/new" className="text-xs text-orange-800 underline mt-2 inline-block">
                          Add Income →
                        </Link>
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
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        budgetType === 'percentage'
                          ? "border-brand-600 bg-brand-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
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
                        min="10"
                        max="100"
                        step="5"
                        value={percentageValue}
                        onChange={(e) => setPercentageValue(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-gray-600">10%</span>
                        <span className="text-lg font-semibold text-brand-600">
                          {percentageValue}%
                        </span>
                        <span className="text-sm text-gray-600">100%</span>
                      </div>
                    </div>
                    {totalIncome > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          Your budget will be: <span className="font-semibold text-brand-600">${calculatedAmount.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          ({percentageValue}% of ${totalIncome.toFixed(2)} income)
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
                
                {/* Hidden fields */}
                <input type="hidden" name="totalIncome" value={totalIncome} />
                <input type="hidden" name="month" value={currentMonth} />
                <input type="hidden" name="year" value={currentYear} />
                
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
                    disabled={isSubmitting || (budgetType === 'percentage' && totalIncome === 0)}
                    className={cn(theme.components.button.primary, "flex-1")}
                  >
                    {isSubmitting ? 'Setting Budget...' : 'Set Budget'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className={theme.components.button.secondary}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Form>
          )}
        </div>
      </main>
    </div>
  );
}
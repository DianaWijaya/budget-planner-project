import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData, useActionData, useNavigate } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import * as Icons from 'lucide-react';

/**
 * LOADER: Fetch budget and spending for current month
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Fetch budget for current month (only one per month)
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
 * ACTION: Delete budget
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get('intent');
  const budgetId = formData.get('budgetId');
  
  if (intent === 'delete' && typeof budgetId === 'string') {
    // Verify ownership
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });
    
    if (!budget) {
      return { error: 'Budget not found' };
    }
    
    await prisma.budget.delete({
      where: { id: budgetId },
    });
    
    return { success: 'Budget deleted' };
  }
  
  return { error: 'Invalid action' };
}

/**
 * COMPONENT: Budgets Page
 */
export default function BudgetsPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  
  const monthName = new Date(data.currentYear, data.currentMonth - 1).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const isOverBudget = data.percentage > 100;
  const isWarning = data.percentage > 80 && data.percentage <= 100;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className={theme.layout.container}>
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className={cn(theme.typography.h4, "text-brand-600 hover:text-brand-700 flex items-center gap-2")}>
              <Icons.ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link> 
            {data.budget ? (
              <Link
                to={`/budgets/${data.budget.id}/edit`}
                className={theme.components.button.primary}
              >
                Edit Budget
              </Link>
            ) : (
              <Link
                to="/budgets/new"
                className={theme.components.button.primary}
              >
                + Set Budget
              </Link>
            )}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, theme.layout.section)}>
        <div className="mb-6">
          <h1 className={theme.typography.h1}>Monthly Budget</h1>
          <p className={theme.typography.bodySmall}>
            Your budget for {monthName}
          </p>
        </div>
        
        {/* Messages */}
        {actionData?.success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800">{actionData.success}</p>
          </div>
        )}
        
        {actionData?.error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{actionData.error}</p>
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
        
        {/* Budget Status */}
        {data.budget ? (
          <div className={theme.components.card.base}>
            <div className={theme.layout.card}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={theme.typography.h3}>Budget Progress</h3>
                  <p className={theme.typography.bodySmall}>
                    ${data.totalExpenses.toFixed(2)} of ${data.budgetAmount.toFixed(2)} spent
                  </p>
                </div>
                
                {/* Status Badge */}
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
              
              {/* Progress Bar */}
              <div className="mb-4">
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
              
              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Link
                  to={`/budgets/${data.budget.id}/edit`}
                  className={cn(theme.components.button.secondary, "flex-1 text-center")}
                >
                  Edit Budget
                </Link>
                <Form method="post" className="flex-1">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="budgetId" value={data.budget.id} />
                  <button
                    type="submit"
                    className={cn(theme.components.button.danger, "w-full")}
                    onClick={(e) => {
                      if (!confirm('Delete this budget?')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Delete Budget
                  </button>
                </Form>
              </div>
            </div>
          </div>
        ) : (
          /* No Budget Set */
          <div className={cn(theme.components.card.base, "text-center py-12")}>
            <Icons.Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className={cn(theme.typography.h3, "mt-4")}>No budget set for this month</h3>
            <p className={cn(theme.typography.bodySmall, "mt-2")}>
              Set a monthly budget to track your spending and stay on target
            </p>
            <Link
              to="/budgets/new"
              className={cn(theme.components.button.primary, "mt-6 inline-flex")}
            >
              Set Monthly Budget
            </Link>
          </div>
        )}
        
        {/* Tips */}
        <div className={cn(theme.components.card.base, "mt-8")}>
          <div className={theme.layout.card}>
            <h3 className={cn(theme.typography.h4, "mb-3")}>
              💡 Budgeting Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Set your budget based on your total monthly income</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Review and adjust your budget monthly based on spending patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Track your spending regularly to stay within your budget</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
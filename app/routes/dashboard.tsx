import { type LoaderFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import { DEFAULT_CATEGORIES } from '~/lib/constants';
import { Chatbot } from '~/components/Chatbot';
import * as Icons from 'lucide-react';

/**
 * LOADER: Fetch all dashboard data
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get current month date range
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0);
  
  // Fetch transactions for this month
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    orderBy: {
      date: 'desc',
    },
    take: 10,
  });
  
  // Fetch budget for this month
  const budget = await prisma.budget.findUnique({
    where: {
      userId_month_year: {
        userId,
        month: currentMonth,
        year: currentYear,
      },
    },
  });
  
  // Fetch incomes for this month
  const incomes = await prisma.income.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });
  
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
    },
  });
  
  // Calculate summary
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const budgetAmount = budget?.amount || 0;
  const remainingBudget = budgetAmount - totalExpenses;
  const budgetPercentage = budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;
  
  // Calculate spending by category
  const spendingByCategory = transactions.reduce((acc, tx) => {
    const categoryName = tx.category;
    if (!acc[categoryName]) {
      // Find category config from preset
      const categoryConfig = DEFAULT_CATEGORIES.find(c => c.name === categoryName) || {
        name: categoryName,
        color: '#6b7280',
        icon: 'Tag' as const
      };
      
      acc[categoryName] = {
        name: categoryName,
        color: categoryConfig.color,
        icon: categoryConfig.icon,
        total: 0,
        count: 0,
      };
    }
    acc[categoryName].total += tx.amount;
    acc[categoryName].count += 1;
    return acc;
  }, {} as Record<string, { name: string; color: string; icon: string; total: number; count: number }>);
  
  const topCategories = Object.values(spendingByCategory)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  
  return {
    user,
    transactions,
    budget,
    incomes,
    summary: {
      totalIncome,
      totalExpenses,
      budgetAmount,
      remainingBudget,
      budgetPercentage,
    },
    topCategories,
    currentMonth,
    currentYear,
  };
}

/**
 * Helper to get category config
 */
function getCategoryConfig(categoryName: string) {
  return DEFAULT_CATEGORIES.find(c => c.name === categoryName) || {
    name: categoryName,
    color: '#6b7280',
    icon: 'Tag' as const
  };
}

/**
 * COMPONENT: Dashboard
 */
export default function DashboardPage() {
  const data = useLoaderData<typeof loader>();
  
  const getIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] as any;
    return Icon || Icons.Tag;
  };
  
  const isOverBudget = data.summary.budgetPercentage > 100;
  const isWarning = data.summary.budgetPercentage > 80 && data.summary.budgetPercentage <= 100;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white shadow">
        <div className={theme.layout.container}>
          <div className="flex h-16 justify-between items-center">
            <Link to="/dashboard" className="flex items-center gap-2">
              <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={cn(theme.typography.h4, "text-brand-600")}>
                Costally
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className={theme.typography.bodySmall}>{data.user?.email}</span>
              <Form method="post" action="/logout">
                <button type="submit" className={theme.components.button.danger}>
                  Logout
                </button>
              </Form>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, theme.layout.section)}>
        {/* Header with Quick Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className={theme.typography.h1}>Dashboard</h2>
            <p className={theme.typography.bodySmall}>
              Overview of your finances for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/transactions/new"
              className={theme.components.button.primary}
            >
              <Icons.Plus className="inline h-4 w-4 mr-2" />
              Add Transaction
            </Link>
            <Link
              to="/budgets"
              className={theme.components.button.secondary}
            >
              <Icons.Target className="inline h-4 w-4 mr-2" />
              Budget
            </Link>

            <Link
              to="/incomes"
              className={theme.components.button.secondary}
            >
              <Icons.DollarSign className="inline h-4 w-4 mr-2" />
              Income
            </Link>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Income */}
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>Total Income</p>
                <div className="rounded-full bg-green-100 p-2">
                  <Icons.TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className={cn(theme.typography.h2, theme.colors.income.text)}>
                ${data.summary.totalIncome.toFixed(2)}
              </p>
              <p className={theme.typography.bodyTiny}>
                {data.incomes.length} income sources
              </p>
            </div>
          </div>
          
          {/* Total Expenses */}
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>Total Expenses</p>
                <div className="rounded-full bg-red-100 p-2">
                  <Icons.TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <p className={cn(theme.typography.h2, theme.colors.expense.text)}>
                ${data.summary.totalExpenses.toFixed(2)}
              </p>
              <p className={theme.typography.bodyTiny}>
                {data.transactions.length} transactions
              </p>
            </div>
          </div>
          
          {/* Monthly Budget */}
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>Monthly Budget</p>
                <div className="rounded-full bg-blue-100 p-2">
                  <Icons.Target className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className={cn(theme.typography.h2, 'text-blue-600')}>
                ${data.summary.budgetAmount.toFixed(2)}
              </p>
              <p className={theme.typography.bodyTiny}>
                {data.budget ? 'Budget set' : 'No budget set'}
              </p>
            </div>
          </div>
          
          {/* Remaining Budget */}
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>Remaining</p>
                <div className={cn(
                  "rounded-full p-2",
                  data.summary.remainingBudget >= 0 ? "bg-green-100" : "bg-red-100"
                )}>
                  <Icons.Wallet className={cn(
                    "h-5 w-5",
                    data.summary.remainingBudget >= 0 ? "text-green-600" : "text-red-600"
                  )} />
                </div>
              </div>
              <p className={cn(
                theme.typography.h2,
                data.summary.remainingBudget >= 0 ? theme.colors.income.text : theme.colors.expense.text
              )}>
                ${Math.abs(data.summary.remainingBudget).toFixed(2)}
              </p>
              <p className={theme.typography.bodyTiny}>
                {data.summary.remainingBudget >= 0 ? 'Under budget' : 'Over budget'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Budget Progress Bar */}
        {data.budget && (
          <div className={cn(theme.components.card.base, "mb-8")}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className={theme.typography.h4}>Budget Progress</h3>
                  <p className={theme.typography.bodyTiny}>
                    ${data.summary.totalExpenses.toFixed(2)} of ${data.summary.budgetAmount.toFixed(2)} spent
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
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={cn(
                    "h-3 rounded-full transition-all",
                    isOverBudget ? 'bg-red-500' :
                    isWarning ? 'bg-orange-500' :
                    'bg-green-500'
                  )}
                  style={{ 
                    width: `${Math.min(data.summary.budgetPercentage, 100)}%` 
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className={theme.typography.bodyTiny}>
                  {data.summary.budgetPercentage.toFixed(1)}% used
                </span>
                <span className={cn(
                  theme.typography.bodyTiny,
                  data.summary.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  ${Math.abs(data.summary.remainingBudget).toFixed(2)} 
                  {data.summary.remainingBudget >= 0 ? ' remaining' : ' over'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Categories */}
          <div className={theme.components.card.base}>
            <div className={theme.layout.card}>
              <h3 className={cn(theme.typography.h3, 'mb-4')}>
                Top Spending Categories
              </h3>
              {data.topCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Icons.PieChart className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className={theme.typography.bodySmall}>No spending data yet</p>
                  <p className={theme.typography.bodyTiny}>
                    Add transactions to see your spending breakdown
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.topCategories.map((item) => {
                    const IconComponent = getIcon(item.icon);
                    const percentage = data.summary.totalExpenses > 0
                      ? (item.total / data.summary.totalExpenses) * 100
                      : 0;
                    
                    return (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${item.color}20` }}
                            >
                              <IconComponent
                                className="h-4 w-4"
                                style={{ color: item.color }}
                              />
                            </div>
                            <span className={theme.typography.bodySmall}>
                              {item.name}
                            </span>
                          </div>
                          <span className={cn(theme.typography.bodySmall, 'font-semibold')}>
                            ${item.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                        <p className={theme.typography.bodyTiny}>
                          {item.count} transactions · {percentage.toFixed(0)}% of total
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className={theme.components.card.base}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={theme.typography.h3}>Recent Transactions</h3>
                <Link
                  to="/transactions"
                  className="text-sm text-brand-600 hover:text-brand-700"
                >
                  View all →
                </Link>
              </div>
              
              {data.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Icons.Receipt className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className={theme.typography.bodySmall}>No transactions yet</p>
                  <Link
                    to="/transactions/new"
                    className={cn(theme.components.button.primary, 'mt-4 inline-flex')}
                  >
                    Add Your First Transaction
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.transactions.slice(0, 5).map((tx) => {
                    const categoryConfig = getCategoryConfig(tx.category);
                    const IconComponent = getIcon(categoryConfig.icon);
                    
                    return (
                      <Link
                        key={tx.id}
                        to={`/transactions/${tx.id}`}
                        className="flex items-center justify-between hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${categoryConfig.color}20` }}
                          >
                            <IconComponent
                              className="h-5 w-5"
                              style={{ color: categoryConfig.color }}
                            />
                          </div>
                          <div>
                            <p className={theme.typography.bodySmall}>
                              {tx.description || tx.category}
                            </p>
                            <p className={theme.typography.bodyTiny}>
                              {new Date(tx.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={cn(theme.typography.bodySmall, 'font-semibold text-red-600')}>
                          -${tx.amount.toFixed(2)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/transactions"
            className={cn(theme.components.button.outline, 'text-center py-4')}
          >
            <Icons.List className="inline h-5 w-5 mr-2" />
            All Transactions
          </Link>
          <Link
            to="/incomes"
            className={cn(theme.components.button.outline, 'text-center py-4')}
          >
            <Icons.DollarSign className="inline h-5 w-5 mr-2" />
            Income
          </Link>
          <Link
            to="/budgets"
            className={cn(theme.components.button.outline, 'text-center py-4')}
          >
            <Icons.Target className="inline h-5 w-5 mr-2" />
            Budget
          </Link>
        </div>
      </main>
      <Chatbot />
    </div>
  );
}
import { type LoaderFunctionArgs } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import { DEFAULT_CATEGORIES } from '~/lib/constants';
import * as Icons from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ReferenceLine,
} from 'recharts';

/**
 * LOADER: Fetch analytics data
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get last 6 months of data
  const monthsData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    
    const incomes = await prisma.income.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    
    const budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
        },
      },
    });
    
    const totalExpenses = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const savingsAmount = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;
    
    monthsData.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: date,
      expenses: totalExpenses,
      income: totalIncome,
      budget: budget?.amount || 0,
      transactions: transactions.length,
      savings: savingsAmount,
      savingsRate: savingsRate,
      avgTransactionSize: transactions.length > 0 ? totalExpenses / transactions.length : 0,
    });
  }
  
  // Get current month data for category breakdown
  const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
  const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
  
  const currentMonthTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startOfCurrentMonth,
        lte: endOfCurrentMonth,
      },
    },
  });
  
  // Calculate spending by category
  const categorySpending = currentMonthTransactions.reduce((acc, tx) => {
    if (!acc[tx.category]) {
      acc[tx.category] = 0;
    }
    acc[tx.category] += tx.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const categoryData = Object.entries(categorySpending).map(([name, value]) => {
    const categoryConfig = DEFAULT_CATEGORIES.find(c => c.name === name);
    return {
      name,
      value,
      color: categoryConfig?.color || '#6b7280',
    };
  }).sort((a, b) => b.value - a.value);
  
  // Calculate daily spending for current month
  const dailySpending: Record<number, number> = {};
  currentMonthTransactions.forEach(tx => {
    const day = new Date(tx.date).getDate();
    if (!dailySpending[day]) {
      dailySpending[day] = 0;
    }
    dailySpending[day] += tx.amount;
  });
  
  const dailyData = Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => ({
    day: i + 1,
    spending: dailySpending[i + 1] || 0,
  }));
  
  // Calculate summary stats
  const totalExpensesAllTime = monthsData.reduce((sum, m) => sum + m.expenses, 0);
  const totalIncomeAllTime = monthsData.reduce((sum, m) => sum + m.income, 0);
  const avgMonthlyExpenses = totalExpensesAllTime / monthsData.length;
  const currentMonthExpenses = monthsData[monthsData.length - 1]?.expenses || 0;
  const lastMonthExpenses = monthsData[monthsData.length - 2]?.expenses || 0;
  const expenseChange = lastMonthExpenses > 0 
    ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
    : 0;
  
  return {
    monthsData,
    categoryData,
    dailyData,
    stats: {
      totalExpenses: totalExpensesAllTime,
      totalIncome: totalIncomeAllTime,
      avgMonthlyExpenses,
      expenseChange,
    },
  };
}

/**
 * Custom Tooltip Component
 */
/**
 * Custom Tooltip Component
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => {
          // Handle different value types
          const value = entry.value;
          let displayValue: string;
          
          if (typeof value === 'number') {
            if (entry.name === 'Savings Rate') {
              displayValue = `${value.toFixed(1)}%`;
            } else {
              displayValue = `$${value.toFixed(2)}`;
            }
          } else {
            displayValue = String(value || '0');
          }
          
          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {displayValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

/**
 * COMPONENT: Analytics Dashboard
 */
export default function AnalyticsPage() {
  const { monthsData, categoryData, dailyData, stats } = useLoaderData<typeof loader>();
  
  // Calculate average savings rate
  const avgSavingsRate = monthsData.reduce((sum, m) => sum + m.savingsRate, 0) / monthsData.length;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className={theme.layout.container}>
          <div className="flex h-16 items-center">
            <Link 
              to="/dashboard"
              className={cn(theme.typography.h4, "text-brand-600 hover:text-brand-700 flex items-center gap-2")}
            >
              <Icons.ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, theme.layout.section)}>
        {/* Header */}
        <div className="mb-6">
          <h1 className={theme.typography.h1}>Analytics</h1>
          <p className={theme.typography.bodySmall}>
            Insights into your spending patterns and financial trends
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>6-Month Total</p>
                <Icons.TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <p className={cn(theme.typography.h2, theme.colors.expense.text)}>
                ${stats.totalExpenses.toFixed(2)}
              </p>
              <p className={theme.typography.bodyTiny}>Total expenses</p>
            </div>
          </div>
          
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>6-Month Income</p>
                <Icons.TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className={cn(theme.typography.h2, theme.colors.income.text)}>
                ${stats.totalIncome.toFixed(2)}
              </p>
              <p className={theme.typography.bodyTiny}>Total income</p>
            </div>
          </div>
          
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>Monthly Average</p>
                <Icons.Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <p className={cn(theme.typography.h2, 'text-blue-600')}>
                ${stats.avgMonthlyExpenses.toFixed(2)}
              </p>
              <p className={theme.typography.bodyTiny}>Avg. spending</p>
            </div>
          </div>
          
          <div className={theme.components.card.hover}>
            <div className={theme.layout.card}>
              <div className="flex items-center justify-between mb-2">
                <p className={theme.typography.bodySmall}>vs Last Month</p>
                {stats.expenseChange >= 0 ? (
                  <Icons.ArrowUp className="h-5 w-5 text-red-600" />
                ) : (
                  <Icons.ArrowDown className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className={cn(
                theme.typography.h2,
                stats.expenseChange >= 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {stats.expenseChange >= 0 ? '+' : ''}{stats.expenseChange.toFixed(1)}%
              </p>
              <p className={theme.typography.bodyTiny}>Expense change</p>
            </div>
          </div>
        </div>
        
        {/* Charts Grid */}
        <div className="space-y-6">
          {/* Income vs Expenses Trend - FULL WIDTH */}
          <div className={theme.components.card.base}>
            <div className={theme.layout.card}>
              <h2 className={cn(theme.typography.h3, 'mb-4')}>
                Income vs Expenses (Last 6 Months)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Category Breakdown - FULL WIDTH */}
          <div className={theme.components.card.base}>
            <div className={theme.layout.card}>
              <h2 className={cn(theme.typography.h3, 'mb-4')}>
                Spending by Category (This Month)
              </h2>
              {categoryData.length === 0 ? (
                <div className="text-center py-12">
                  <Icons.PieChart className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className={theme.typography.bodySmall}>No spending data yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                            const pct = percent !== undefined ? (percent * 100).toFixed(0) : '0';
                            return `${name} ${pct}%`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number | undefined) => `$${(value || 0).toFixed(2)}`}
                        />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend with more details */}
                  <div className="space-y-3">
                    {categoryData.map((cat) => {
                      const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                      const percentage = (cat.value / total) * 100;
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-4 w-4 rounded-full" 
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="font-medium">{cat.name}</span>
                            </div>
                            <span className="font-semibold">${cat.value.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: cat.color 
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Two Column Layout - Monthly Comparison + Transaction Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Comparison */}
            <div className={theme.components.card.base}>
              <div className={theme.layout.card}>
                <h2 className={cn(theme.typography.h3, 'mb-4')}>
                  Monthly Comparison
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                    <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Transaction Volume */}
            <div className={theme.components.card.base}>
              <div className={theme.layout.card}>
                <h2 className={cn(theme.typography.h3, 'mb-4')}>
                  Transaction Volume
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                        formatter={(value: number | undefined) => [
                            `${value || 0} transactions`, 
                            'Count'
                        ]}
                    />
                    <Bar 
                      dataKey="transactions" 
                      fill="#8b5cf6" 
                      name="Transactions"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Daily Spending Trend */}
          <div className={theme.components.card.base}>
            <div className={theme.layout.card}>
              <h2 className={cn(theme.typography.h3, 'mb-4')}>
                Daily Spending (This Month)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spending" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Spending"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Full Financial Health Dashboard */}
          <div className={theme.components.card.base}>
            <div className={theme.layout.card}>
              <div className="mb-4">
                <h2 className={cn(theme.typography.h3)}>
                  🎯 Complete Financial Health Dashboard
                </h2>
                <p className={theme.typography.bodySmall}>
                  Multi-metric analysis: Income, Expenses, Savings Rate, and Average Transaction Size
                </p>
              </div>
              
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={monthsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  
                  {/* Left Y-Axis for Money */}
                  <YAxis 
                    yAxisId="left"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  
                  {/* Right Y-Axis for Percentages */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Income Area (Background) */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="income"
                    fill="#10b981"
                    fillOpacity={0.2}
                    stroke="none"
                    name="Income"
                  />
                  
                  {/* Expenses Area */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="expenses"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    stroke="none"
                    name="Expenses"
                  />
                  
                  {/* Budget Line */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="budget"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Budget"
                  />
                  
                  {/* Savings Rate Line (Right Axis) */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="savingsRate"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    name="Savings Rate"
                  />
                  
                  {/* Average Transaction Size as Scatter */}
                  <Scatter
                    yAxisId="left"
                    dataKey="avgTransactionSize"
                    fill="#f59e0b"
                    name="Avg Transaction"
                  />
                  
                  {/* Reference Line for 20% Savings Goal */}
                  <ReferenceLine 
                    yAxisId="right"
                    y={20} 
                    stroke="#10b981" 
                    strokeDasharray="3 3"
                    label={{ value: '20% Savings Goal', position: 'right' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              {/* Legend Explanation */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 opacity-20"></div>
                  <span>Income (Background area)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 opacity-30"></div>
                  <span>Expenses (Overlay area)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 border-2 border-dashed border-blue-600"></div>
                  <span>Budget (Dashed line)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 bg-purple-600"></div>
                  <span>Savings Rate % (Right axis)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span>Avg Transaction Size</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 border-2 border-dashed border-green-600"></div>
                  <span>20% Savings Goal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Insights */}
        <div className={cn(theme.components.card.base, "mt-8")}>
          <div className={theme.layout.card}>
            <h3 className={cn(theme.typography.h4, "mb-3")}>
              💡 Financial Insights
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              {stats.expenseChange > 20 && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                  <Icons.AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">High Spending Alert</p>
                    <p className="text-orange-700 text-xs">
                      Your spending increased by {stats.expenseChange.toFixed(1)}% this month
                    </p>
                  </div>
                </div>
              )}
              
              {stats.expenseChange < -10 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <Icons.TrendingDown className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Great Progress!</p>
                    <p className="text-green-700 text-xs">
                      You reduced spending by {Math.abs(stats.expenseChange).toFixed(1)}% this month
                    </p>
                  </div>
                </div>
              )}
              
              {avgSavingsRate >= 20 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <Icons.Trophy className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Excellent Savings Rate! 🎉</p>
                    <p className="text-green-700 text-xs">
                      You're averaging {avgSavingsRate.toFixed(1)}% savings rate - above the 20% goal!
                    </p>
                  </div>
                </div>
              )}
              
              {categoryData.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <Icons.Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Top Spending Category</p>
                    <p className="text-blue-700 text-xs">
                      Most spent on {categoryData[0].name}: ${categoryData[0].value.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
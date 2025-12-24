import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData, useActionData, useSearchParams } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import * as Icons from 'lucide-react';

/**
 * LOADER: Fetch all incomes with filters
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);

  const month = url.searchParams.get('month');
  const search = url.searchParams.get('search');

  const where: any = { userId };

  if (month) {
    const [year, monthNum] = month.split('-');
    const startDate = new Date(+year, +monthNum - 1, 1);
    const endDate = new Date(+year, +monthNum, 0);
    where.date = { gte: startDate, lte: endDate };
  }

  if (search) {
    where.source = { contains: search, mode: 'insensitive' };
  }

  // Filtered incomes (existing)
  const incomes = await prisma.income.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  const filteredTotal = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // 🔹 Total accumulated income (ALL TIME)
  const accumulatedAgg = await prisma.income.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  const totalAccumulated = accumulatedAgg._sum.amount ?? 0;

  // 🔹 Total income THIS MONTH
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthAgg = await prisma.income.aggregate({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: { amount: true },
  });

  const totalThisMonth = monthAgg._sum.amount ?? 0;

  return {
    incomes,
    filteredTotal,
    totalAccumulated,
    totalThisMonth,
  };
}

/**
 * ACTION: Delete income
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get('intent');
  const incomeId = formData.get('incomeId');
  
  if (intent === 'delete' && typeof incomeId === 'string') {
    // Verify ownership
    const income = await prisma.income.findFirst({
      where: { id: incomeId, userId },
    });
    
    if (!income) {
      return { error: 'Income not found' };
    }
    
    await prisma.income.delete({
      where: { id: incomeId },
    });
    
    return { success: 'Income deleted' };
  }
  
  return { error: 'Invalid action' };
}

/**
 * COMPONENT: Incomes List
 */
export default function IncomesPage() {
  const { incomes, filteredTotal, totalAccumulated, totalThisMonth } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  
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
            <Link
              to="/incomes/new"
              className={theme.components.button.primary}
            >
              <Icons.Plus className="h-4 w-4 mr-2 inline" />
              Add Income
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, theme.layout.section)}>
        <div className="mb-6">
          <h1 className={theme.typography.h1}>Income</h1>
          <p className={theme.typography.bodySmall}>
            Track your income sources
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
        
        {/* Filters */}
        <div className={cn(theme.components.card.base, "mb-6")}>
          <div className={theme.layout.card}>
            <Form method="get" className="flex flex-wrap gap-4">
              {/* Month Filter */}
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="month" className={theme.typography.labelSmall}>
                  Month
                </label>
                <input
                  id="month"
                  name="month"
                  type="month"
                  defaultValue={searchParams.get('month') || ''}
                  className={theme.components.input.base}
                />
              </div>
              
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="search" className={theme.typography.labelSmall}>
                  Search Source
                </label>
                <input
                  id="search"
                  name="search"
                  type="text"
                  placeholder="e.g., Salary, Freelance..."
                  defaultValue={searchParams.get('search') || ''}
                  className={theme.components.input.base}
                />
              </div>
              
              {/* Buttons */}
              <div className="flex items-end gap-2">
                <button type="submit" className={theme.components.button.primary}>
                  <Icons.Search className="h-4 w-4 mr-1 inline" />
                  Apply
                </button>
                <Link to="/incomes" className={theme.components.button.secondary}>
                  Clear
                </Link>
              </div>
            </Form>
          </div>
        </div>
        
        {/* Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* Total Accumulated */}
            <div className={theme.components.card.base}>
                <div className={theme.layout.card}>
                <div className="flex items-center gap-2">
                    <Icons.Wallet className="h-5 w-5 text-green-600" />
                    <span className={theme.typography.body}>Total Income (All Time)</span>
                </div>
                <p className={cn(theme.typography.h2, theme.colors.income.text)}>
                    ${totalAccumulated.toFixed(2)}
                </p>
                </div>
            </div>

            {/* This Month */}
            <div className={theme.components.card.base}>
                <div className={theme.layout.card}>
                <div className="flex items-center gap-2">
                    <Icons.Calendar className="h-5 w-5 text-blue-600" />
                    <span className={theme.typography.body}>Income This Month</span>
                </div>
                <p className={cn(theme.typography.h2, "text-blue-600")}>
                    ${totalThisMonth.toFixed(2)}
                </p>
                </div>
            </div>
        </div>

        
        {/* Incomes List */}
        {incomes.length === 0 ? (
          <div className={cn(theme.components.card.base, "text-center py-12")}>
            <Icons.DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className={cn(theme.typography.h3, "mt-4")}>No income recorded</h3>
            <p className={cn(theme.typography.bodySmall, "mt-2")}>
              {searchParams.get('month') || searchParams.get('search')
                ? 'Try adjusting your filters or clear them to see all income'
                : 'Start tracking your income by adding your first source'}
            </p>
            <div className="flex gap-3 justify-center mt-6">
              {(searchParams.get('month') || searchParams.get('search')) && (
                <Link
                  to="/incomes"
                  className={theme.components.button.secondary}
                >
                  Clear Filters
                </Link>
              )}
              <Link
                to="/incomes/new"
                className={theme.components.button.primary}
              >
                <Icons.Plus className="h-4 w-4 mr-2 inline" />
                Add Income
              </Link>
            </div>
          </div>
        ) : (
          <div className={theme.components.card.base}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {incomes.map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(income.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                            <Icons.DollarSign className="h-4 w-4 text-green-600" />
                          </div>
                          {income.source || 'Income'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                        +${income.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/incomes/${income.id}/edit`}
                            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                          >
                            <Icons.Edit2 className="h-4 w-4" />
                            Edit
                          </Link>
                          <Form method="post" className="inline">
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="incomeId" value={income.id} />
                            <button
                              type="submit"
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              onClick={(e) => {
                                if (!confirm('Delete this income? This cannot be undone.')) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <Icons.Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
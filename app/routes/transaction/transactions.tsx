import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData, useActionData, useSearchParams } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import { DEFAULT_CATEGORIES } from '~/lib/constants';
import * as Icons from 'lucide-react';

/**
 * LOADER: Fetch all transactions with filters
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  
  // Get filter parameters
  const category = url.searchParams.get('category');
  const month = url.searchParams.get('month');
  const search = url.searchParams.get('search');
  
  // Build where clause
  const where: any = { userId };
  
  if (category) {
    where.category = category;
  }
  
  if (month) {
    const [year, monthNum] = month.split('-');
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }
  
  if (search) {
    where.description = {
      contains: search,
      mode: 'insensitive',
    };
  }
  
  // Fetch transactions
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: {
      date: 'desc',
    },
  });
  
  // Calculate totals
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  return { 
    transactions, 
    categories: DEFAULT_CATEGORIES,
    total 
  };
}

/**
 * ACTION: Delete transaction
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get('intent');
  const transactionId = formData.get('transactionId');
  
  if (intent === 'delete' && typeof transactionId === 'string') {
    // Verify ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });
    
    if (!transaction) {
      return { error: 'Transaction not found' };
    }
    
    await prisma.transaction.delete({
      where: { id: transactionId },
    });
    
    return { success: 'Transaction deleted' };
  }
  
  return { error: 'Invalid action' };
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
 * COMPONENT: Transactions List
 */
export default function TransactionsPage() {
  const { transactions, categories, total } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  
  const getIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] as any;
    return Icon || Icons.Tag;
  };
  
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
              to="/transactions/new"
              className={theme.components.button.primary}
            >
              <Icons.Plus className="h-4 w-4 mr-2 inline" />
              New Transaction
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, theme.layout.section)}>
        <div className="mb-6">
          <h1 className={theme.typography.h1}>Transactions</h1>
          <p className={theme.typography.bodySmall}>
            Track and manage your expenses
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
              {/* Category Filter */}
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="category" className={theme.typography.labelSmall}>
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  defaultValue={searchParams.get('category') || ''}
                  className={theme.components.input.base}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
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
                  Search
                </label>
                <input
                  id="search"
                  name="search"
                  type="text"
                  placeholder="Description..."
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
                <Link to="/transactions" className={theme.components.button.secondary}>
                  Clear
                </Link>
              </div>
            </Form>
          </div>
        </div>
        
        {/* Total */}
        <div className={cn(theme.components.card.base, "mb-6")}>
          <div className={theme.layout.card}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.Calculator className="h-5 w-5 text-gray-600" />
                <span className={theme.typography.body}>Total Expenses</span>
              </div>
              <span className={cn(theme.typography.h2, theme.colors.expense.text)}>
                ${total.toFixed(2)}
              </span>
            </div>
            <p className={theme.typography.bodyTiny}>
              {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
            </p>
          </div>
        </div>
        
        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className={cn(theme.components.card.base, "text-center py-12")}>
            <Icons.Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className={cn(theme.typography.h3, "mt-4")}>No transactions found</h3>
            <p className={cn(theme.typography.bodySmall, "mt-2")}>
              {searchParams.get('category') || searchParams.get('month') || searchParams.get('search')
                ? 'Try adjusting your filters or clear them to see all transactions'
                : 'Start tracking your expenses by adding your first transaction'}
            </p>
            <div className="flex gap-3 justify-center mt-6">
              {(searchParams.get('category') || searchParams.get('month') || searchParams.get('search')) && (
                <Link
                  to="/transactions"
                  className={theme.components.button.secondary}
                >
                  Clear Filters
                </Link>
              )}
              <Link
                to="/transactions/new"
                className={theme.components.button.primary}
              >
                <Icons.Plus className="h-4 w-4 mr-2 inline" />
                Add Transaction
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
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
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
                  {transactions.map((transaction) => {
                    const categoryConfig = getCategoryConfig(transaction.category);
                    const IconComponent = getIcon(categoryConfig.icon);
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${categoryConfig.color}20` }}
                            >
                              <IconComponent
                                className="h-4 w-4"
                                style={{ color: categoryConfig.color }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">
                              {transaction.category}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span>{transaction.description || '-'}</span>
                            {transaction.isRecurring && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                <Icons.Repeat className="h-3 w-3" />
                                {transaction.frequency}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              to={`/transactions/${transaction.id}`}
                              className="text-brand-600 hover:text-brand-900 flex items-center gap-1"
                            >
                              <Icons.Eye className="h-4 w-4" />
                              View
                            </Link>
                            <Link
                              to={`/transactions/${transaction.id}/edit`}
                              className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                            >
                              <Icons.Edit2 className="h-4 w-4" />
                              Edit
                            </Link>
                            <Form method="post" className="inline">
                              <input type="hidden" name="intent" value="delete" />
                              <input type="hidden" name="transactionId" value={transaction.id} />
                              <button
                                type="submit"
                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                onClick={(e) => {
                                  if (!confirm('Delete this transaction? This cannot be undone.')) {
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
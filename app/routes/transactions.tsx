import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData, useActionData, useSearchParams } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import * as Icons from 'lucide-react';

/**
 * LOADER: Fetch all transactions with filters
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  
  // Get filter parameters
  const categoryId = url.searchParams.get('category');
  const month = url.searchParams.get('month');
  const search = url.searchParams.get('search');
  
  // Build where clause
  const where: any = { userId };
  
  if (categoryId) {
    where.categoryId = categoryId;
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
    include: {
      category: true,
    },
    orderBy: {
      date: 'desc',
    },
  });
  
  // Fetch categories for filter dropdown
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
  
  // Calculate totals
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  return { transactions, categories, total };
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
            <Link to="/dashboard" className={cn(theme.typography.h4, "text-brand-600")}>
              ← Back to Dashboard
            </Link>
            <Link
              to="/transactions/new"
              className={theme.components.button.primary}
            >
              + New Transaction
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
            <p className="text-sm text-green-800">{actionData.success}</p>
          </div>
        )}
        
        {actionData?.error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{actionData.error}</p>
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
                    <option key={cat.id} value={cat.id}>
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
              <span className={theme.typography.body}>Total Expenses</span>
              <span className={cn(theme.typography.h2, theme.colors.expense.text)}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className={cn(theme.components.card.base, "text-center py-12")}>
            <Icons.Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className={cn(theme.typography.h3, "mt-4")}>No transactions yet</h3>
            <p className={cn(theme.typography.bodySmall, "mt-2")}>
              Start tracking your expenses by adding your first transaction
            </p>
            <Link
              to="/transactions/new"
              className={cn(theme.components.button.primary, "mt-6 inline-flex")}
            >
              Add Transaction
            </Link>
          </div>
        ) : (
          <div className={theme.components.card.base}>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.map((transaction) => {
                    const IconComponent = getIcon(transaction.category.icon || 'Tag');
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${transaction.category.color}20` }}
                            >
                              <IconComponent
                                className="h-4 w-4"
                                style={{ color: transaction.category.color }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">
                              {transaction.category.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {transaction.description || '-'}
                          {transaction.isRecurring && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              Recurring
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/transactions/${transaction.id}/edit`}
                              className="text-brand-600 hover:text-brand-900"
                            >
                              Edit
                            </Link>
                            <Form method="post" className="inline">
                              <input type="hidden" name="intent" value="delete" />
                              <input type="hidden" name="transactionId" value={transaction.id} />
                              <button
                                type="submit"
                                className="text-red-600 hover:text-red-900"
                                onClick={(e) => {
                                  if (!confirm('Delete this transaction?')) {
                                    e.preventDefault();
                                  }
                                }}
                              >
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
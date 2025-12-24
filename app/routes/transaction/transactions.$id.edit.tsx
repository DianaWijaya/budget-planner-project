import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData, useActionData, useNavigation } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { TRANSACTION_FREQUENCIES, DEFAULT_CATEGORIES } from '~/lib/constants';
import { theme, cn } from '~/lib/theme';

/**
 * LOADER: Get transaction and categories
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const { id } = params;
  
  if (!id) {
    throw new Response('Transaction ID required', { status: 400 });
  }
  
  // Fetch transaction
  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId, // Ensure user owns this transaction
    },
  });
  
  if (!transaction) {
    throw new Response('Transaction not found', { status: 404 });
  }
  
  // Use DEFAULT_CATEGORIES from constants
  const categories = DEFAULT_CATEGORIES;
  
  return { transaction, categories };
}

/**
 * ACTION: Update or delete transaction
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get('intent');
  
  if (!id) {
    return { error: 'Transaction ID required' };
  }
  
  // Verify ownership
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  
  if (!transaction) {
    return { error: 'Transaction not found' };
  }
  
  // Handle delete
  if (intent === 'delete') {
    await prisma.transaction.delete({
      where: { id },
    });
    return redirect('/transactions');
  }
  
  // Handle update
  const amount = formData.get('amount');
  const category = formData.get('category');
  const description = formData.get('description');
  const date = formData.get('date');
  const isRecurring = formData.get('isRecurring') === 'on';
  const frequency = formData.get('frequency');
  
  // Validation
  const errors: any = {};
  
  if (typeof amount !== 'string' || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    errors.amount = 'Amount must be a positive number';
  }
  
  if (typeof category !== 'string' || !category) {
    errors.category = 'Please select a category';
  }
  
  if (typeof date !== 'string' || !date) {
    errors.date = 'Please select a date';
  }
  
  if (isRecurring && (typeof frequency !== 'string' || !frequency)) {
    errors.frequency = 'Please select frequency for recurring transaction';
  }
  
  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  
  // Verify category is valid
  const isValidCategory = DEFAULT_CATEGORIES.some(c => c.name === category);
  if (!isValidCategory) {
    return { errors: { category: 'Invalid category' } };
  }
  
  // Update transaction
  await prisma.transaction.update({
    where: { id },
    data: {
      amount: parseFloat(amount as string),
      category: category as string,
      description: (description as string) || null,
      date: new Date(date as string),
      isRecurring,
      frequency: isRecurring ? (frequency as string) : null,
    },
  });
  
  return redirect('/transactions');
}

/**
 * COMPONENT: Edit Transaction Form
 */
export default function EditTransactionPage() {
  const { transaction, categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  
  // Format date for input (YYYY-MM-DD)
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className={theme.layout.container}>
          <div className="flex h-16 items-center">
            <Link to="/transactions" className={cn(theme.typography.h4, "text-brand-600")}>
              ← Back to Transactions
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, "py-8")}>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h1 className={theme.typography.h1}>Edit Transaction</h1>
            <p className={theme.typography.bodySmall}>
              Update transaction details
            </p>
          </div>
          
          {/* Error Message */}
          {actionData?.error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{actionData.error}</p>
            </div>
          )}
          
          {/* Form */}
          <Form method="post" className={theme.components.card.base}>
            <div className={cn(theme.layout.card, "space-y-6")}>
              {/* Amount */}
              <div>
                <label htmlFor="amount" className={theme.typography.label}>
                  Amount *
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
                    required
                    defaultValue={transaction.amount}
                    className={cn(theme.components.input.base, "pl-7")}
                  />
                </div>
                {actionData?.errors?.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.amount}
                  </p>
                )}
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="category" className={theme.typography.label}>
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  defaultValue={transaction.category}
                  className={theme.components.input.base}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {actionData?.errors?.category && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.category}
                  </p>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className={theme.typography.label}>
                  Description (Optional)
                </label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  defaultValue={transaction.description || ''}
                  placeholder="e.g., Lunch at cafe"
                  className={theme.components.input.base}
                />
              </div>
              
              {/* Date */}
              <div>
                <label htmlFor="date" className={theme.typography.label}>
                  Date *
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={formatDate(transaction.date)}
                  className={theme.components.input.base}
                />
                {actionData?.errors?.date && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.date}
                  </p>
                )}
              </div>
              
              {/* Recurring */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center">
                  <input
                    id="isRecurring"
                    name="isRecurring"
                    type="checkbox"
                    defaultChecked={transaction.isRecurring}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">
                    This is a recurring transaction
                  </label>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="frequency" className={theme.typography.label}>
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
                    defaultValue={transaction.frequency || ''}
                    className={theme.components.input.base}
                  >
                    <option value="">Select frequency</option>
                    {TRANSACTION_FREQUENCIES.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                  {actionData?.errors?.frequency && (
                    <p className="mt-1 text-sm text-red-600">
                      {actionData.errors.frequency}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  name="intent"
                  value="update"
                  disabled={isSubmitting}
                  className={cn(theme.components.button.primary, "flex-1")}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <Link
                  to="/transactions"
                  className={theme.components.button.secondary}
                >
                  Cancel
                </Link>
              </div>
              
              {/* Delete Button */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  name="intent"
                  value="delete"
                  className={cn(theme.components.button.danger, "w-full")}
                  onClick={(e) => {
                    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
                      e.preventDefault();
                    }
                  }}
                >
                  Delete Transaction
                </button>
              </div>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
}
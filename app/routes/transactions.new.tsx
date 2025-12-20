import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData, useActionData, useNavigation } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { TRANSACTION_FREQUENCIES } from '~/lib/constants';
import { theme, cn } from '~/lib/theme';

/**
 * LOADER: Get categories for dropdown
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
  
  return { categories };
}

/**
 * ACTION: Create new transaction
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const amount = formData.get('amount');
  const categoryId = formData.get('categoryId');
  const description = formData.get('description');
  const date = formData.get('date');
  const isRecurring = formData.get('isRecurring') === 'on';
  const frequency = formData.get('frequency');
  
  // Validation
  const errors: any = {};
  
  if (typeof amount !== 'string' || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    errors.amount = 'Amount must be a positive number';
  }
  
  if (typeof categoryId !== 'string' || !categoryId) {
    errors.categoryId = 'Please select a category';
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
  
  // Verify category belongs to user
  const category = await prisma.category.findFirst({
    where: { id: categoryId as string, userId },
  });
  
  if (!category) {
    return { errors: { categoryId: 'Invalid category' } };
  }
  
  // Create transaction
  await prisma.transaction.create({
    data: {
      amount: parseFloat(amount as string),
      categoryId: categoryId as string,
      description: (description as string) || null,
      date: new Date(date as string),
      isRecurring,
      frequency: isRecurring ? (frequency as string) : null,
      userId,
    },
  });
  
  return redirect('/transactions');
}

/**
 * COMPONENT: New Transaction Form
 */
export default function NewTransactionPage() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  
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
            <h1 className={theme.typography.h1}>Add Transaction</h1>
            <p className={theme.typography.bodySmall}>
              Record a new expense
            </p>
          </div>
          
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
                    placeholder="0.00"
                    className={cn(
                      theme.components.input.base,
                      "pl-7"
                    )}
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
                <label htmlFor="categoryId" className={theme.typography.label}>
                  Category *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  className={theme.components.input.base}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {actionData?.errors?.categoryId && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.categoryId}
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
                  defaultValue={new Date().toISOString().split('T')[0]}
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
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">
                    This is a recurring transaction
                  </label>
                </div>
                
                <div className="mt-4" id="frequency-field">
                  <label htmlFor="frequency" className={theme.typography.label}>
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
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
              
              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(theme.components.button.primary, "flex-1")}
                >
                  {isSubmitting ? 'Adding...' : 'Add Transaction'}
                </button>
                <Link
                  to="/transactions"
                  className={theme.components.button.secondary}
                >
                  Cancel
                </Link>
              </div>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
}
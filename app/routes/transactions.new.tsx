import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, useActionData, useNavigation, useNavigate } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { TRANSACTION_FREQUENCIES, DEFAULT_CATEGORIES } from '~/lib/constants';
import { theme, cn } from '~/lib/theme';
import * as Icons from 'lucide-react';

/**
 * LOADER: Just verify user is logged in
 */
export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return { categories: DEFAULT_CATEGORIES };
}

/**
 * ACTION: Create new transaction
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
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
  const validCategory = DEFAULT_CATEGORIES.find(c => c.name === category);
  if (!validCategory) {
    return { errors: { category: 'Invalid category' } };
  }
  
  // Create transaction
  await prisma.transaction.create({
    data: {
      amount: parseFloat(amount as string),
      category: category as string,
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
 * Helper to get icon component
 */
function getIcon(iconName: string) {
  const Icon = Icons[iconName as keyof typeof Icons] as any;
  return Icon || Icons.Tag;
}

/**
 * COMPONENT: New Transaction Form
 */
export default function NewTransactionPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';
  
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
                <label htmlFor="category" className={theme.typography.label}>
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className={theme.components.input.base}
                >
                  <option value="">Select a category</option>
                  {DEFAULT_CATEGORIES.map((category) => {
                    const IconComponent = getIcon(category.icon);
                    return (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    );
                  })}
                </select>
                {actionData?.errors?.category && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.category}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Choose the category that best fits this expense
                </p>
              </div>
              
              {/* Category Preview */}
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-700 mb-3">Available Categories:</p>
                <div className="grid grid-cols-3 gap-3">
                  {DEFAULT_CATEGORIES.map((cat) => {
                    const IconComponent = getIcon(cat.icon);
                    return (
                      <div
                        key={cat.name}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <IconComponent
                            className="h-5 w-5"
                            style={{ color: cat.color }}
                          />
                        </div>
                        <span className="text-xs text-gray-700 text-center">
                          {cat.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
                <p className="mt-1 text-xs text-gray-500">
                  Add details to help you remember this expense
                </p>
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
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isRecurring"
                      name="isRecurring"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="isRecurring" className="text-sm font-medium text-gray-900">
                      This is a recurring transaction
                    </label>
                    <p className="text-xs text-gray-500">
                      Mark if this expense repeats regularly
                    </p>
                  </div>
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
                  <Icons.Plus className="h-4 w-4 mr-2 inline" />
                  {isSubmitting ? 'Adding...' : 'Add Transaction'}
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
        </div>
      </main>
    </div>
  );
}
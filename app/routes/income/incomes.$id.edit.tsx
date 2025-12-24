import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData, useActionData, useNavigation } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';

/**
 * LOADER: Get income details
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const { id } = params;
  
  if (!id) {
    throw new Response('Income ID required', { status: 400 });
  }
  
  // Fetch income
  const income = await prisma.income.findFirst({
    where: {
      id,
      userId, // Ensure user owns this income
    },
  });
  
  if (!income) {
    throw new Response('Income not found', { status: 404 });
  }
  
  return { income };
}

/**
 * ACTION: Update or delete income
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get('intent');
  
  if (!id) {
    return { error: 'Income ID required' };
  }
  
  // Verify ownership
  const income = await prisma.income.findFirst({
    where: { id, userId },
  });
  
  if (!income) {
    return { error: 'Income not found' };
  }
  
  // Handle delete
  if (intent === 'delete') {
    await prisma.income.delete({
      where: { id },
    });
    return redirect('/incomes');
  }
  
  // Handle update
  const amount = formData.get('amount');
  const source = formData.get('source');
  const date = formData.get('date');
  
  // Validation
  const errors: any = {};
  
  if (typeof amount !== 'string' || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    errors.amount = 'Amount must be a positive number';
  }
  
  if (typeof date !== 'string' || !date) {
    errors.date = 'Please select a date';
  }
  
  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  
  // Update income
  await prisma.income.update({
    where: { id },
    data: {
      amount: parseFloat(amount as string),
      source: (source as string) || null,
      date: new Date(date as string),
    },
  });
  
  return redirect('/incomes');
}

/**
 * COMPONENT: Edit Income Form
 */
export default function EditIncomePage() {
  const { income } = useLoaderData<typeof loader>();
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
            <Link to="/incomes" className={cn(theme.typography.h4, "text-brand-600")}>
              ← Back to Income
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, "py-8")}>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h1 className={theme.typography.h1}>Edit Income</h1>
            <p className={theme.typography.bodySmall}>
              Update income details
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
                    defaultValue={income.amount}
                    className={cn(theme.components.input.base, "pl-7")}
                  />
                </div>
                {actionData?.errors?.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.amount}
                  </p>
                )}
              </div>
              
              {/* Source */}
              <div>
                <label htmlFor="source" className={theme.typography.label}>
                  Source (Optional)
                </label>
                <input
                  id="source"
                  name="source"
                  type="text"
                  defaultValue={income.source || ''}
                  placeholder="e.g., Salary, Freelance, Bonus"
                  className={theme.components.input.base}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Describe where this income came from
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
                  defaultValue={formatDate(income.date)}
                  className={theme.components.input.base}
                />
                {actionData?.errors?.date && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.date}
                  </p>
                )}
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
                  to="/incomes"
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
                    if (!confirm('Are you sure you want to delete this income? This action cannot be undone.')) {
                      e.preventDefault();
                    }
                  }}
                >
                  Delete Income
                </button>
              </div>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
}
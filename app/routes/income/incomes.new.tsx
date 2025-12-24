import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, useActionData, useNavigation, useNavigate } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import * as Icons from 'lucide-react';

/**
 * LOADER: Just verify user is logged in
 */
export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return {};
}

/**
 * ACTION: Create new income
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
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
  
  // Create income
  await prisma.income.create({
    data: {
      amount: parseFloat(amount as string),
      source: (source as string) || null,
      date: new Date(date as string),
      userId,
    },
  });
  
  return redirect('/incomes');
}

/**
 * COMPONENT: New Income Form
 */
export default function NewIncomePage() {
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
            <h1 className={theme.typography.h1}>Add Income</h1>
            <p className={theme.typography.bodySmall}>
              Record a new income source
            </p>
          </div>
          
          {/* Form */}
          <Form method="post" className={theme.components.card.base}>
            <div className={cn(theme.layout.card, "space-y-6")}>
              {/* Info Banner */}
              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <Icons.Info className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Track all your income sources
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Add your salary, freelance work, side hustles, or any other income to get a complete financial picture
                    </p>
                  </div>
                </div>
              </div>
              
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
              
              {/* Source */}
              <div>
                <label htmlFor="source" className={theme.typography.label}>
                  Source (Optional)
                </label>
                <input
                  id="source"
                  name="source"
                  type="text"
                  placeholder="e.g., Monthly Salary, Freelance Project, Side Hustle"
                  className={theme.components.input.base}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Name this income source to help you track different revenue streams
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
                <p className="mt-1 text-xs text-gray-500">
                  When did you receive this income?
                </p>
              </div>
              
              {/* Common Sources Examples */}
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  💡 Common Income Sources:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                  <div className="flex items-center gap-1">
                    <Icons.Check className="h-3 w-3" />
                    <span>Monthly Salary</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icons.Check className="h-3 w-3" />
                    <span>Freelance Work</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icons.Check className="h-3 w-3" />
                    <span>Bonus</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icons.Check className="h-3 w-3" />
                    <span>Side Business</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icons.Check className="h-3 w-3" />
                    <span>Investment Returns</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icons.Check className="h-3 w-3" />
                    <span>Rental Income</span>
                  </div>
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
                  {isSubmitting ? 'Adding...' : 'Add Income'}
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
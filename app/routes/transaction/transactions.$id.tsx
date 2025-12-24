import { type LoaderFunctionArgs } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import { DEFAULT_CATEGORIES } from '~/lib/constants';
import * as Icons from 'lucide-react';

/**
 * LOADER: Get transaction details
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
  
  return { transaction };
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
 * COMPONENT: View Transaction Details
 */
export default function ViewTransactionPage() {
  const { transaction } = useLoaderData<typeof loader>();
  const categoryConfig = getCategoryConfig(transaction.category);
  
  const getIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] as any;
    return Icon || Icons.Tag;
  };
  
  const IconComponent = getIcon(categoryConfig.icon);
  
  // Format date
  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = new Date(transaction.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className={theme.layout.container}>
          <div className="flex h-16 items-center justify-between">
            <Link 
              to="/transactions" 
              className={cn(theme.typography.h4, "text-brand-600 hover:text-brand-700 flex items-center gap-2")}
            >
              <Icons.ArrowLeft className="h-5 w-5" />
              Back to Transactions
            </Link>
            <Link
              to={`/transactions/${transaction.id}/edit`}
              className={theme.components.button.primary}
            >
              <Icons.Edit2 className="h-4 w-4 mr-2 inline" />
              Edit Transaction
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, theme.layout.section)}>
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className={theme.typography.h1}>Transaction Details</h1>
            <p className={theme.typography.bodySmall}>
              View complete transaction information
            </p>
          </div>
          
          {/* Transaction Card */}
          <div className={theme.components.card.base}>
            <div className={theme.layout.card}>
              {/* Amount Section */}
              <div className="text-center pb-6 border-b border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Total Amount</p>
                <p className={cn(theme.typography.h1, "text-red-600")}>
                  ${transaction.amount.toFixed(2)}
                </p>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                {/* Category */}
                <div>
                  <label className={cn(theme.typography.labelSmall, "text-gray-500 mb-2 block")}>
                    Category
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${categoryConfig.color}20` }}
                    >
                      <IconComponent
                        className="h-6 w-6"
                        style={{ color: categoryConfig.color }}
                      />
                    </div>
                    <span className={theme.typography.body}>
                      {transaction.category}
                    </span>
                  </div>
                </div>
                
                {/* Date */}
                <div>
                  <label className={cn(theme.typography.labelSmall, "text-gray-500 mb-2 block")}>
                    Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Icons.Calendar className="h-5 w-5 text-gray-400" />
                    <span className={theme.typography.body}>
                      {formattedDate}
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                <div className="md:col-span-2">
                  <label className={cn(theme.typography.labelSmall, "text-gray-500 mb-2 block")}>
                    Description
                  </label>
                  <div className="flex items-start gap-2">
                    <Icons.FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <span className={theme.typography.body}>
                      {transaction.description || 'No description provided'}
                    </span>
                  </div>
                </div>
                
                {/* Recurring Info */}
                {transaction.isRecurring && (
                  <div className="md:col-span-2">
                    <label className={cn(theme.typography.labelSmall, "text-gray-500 mb-2 block")}>
                      Recurring Transaction
                    </label>
                    <div className="flex items-center gap-2">
                      <Icons.Repeat className="h-5 w-5 text-blue-600" />
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                        {transaction.frequency}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Receipt */}
                {transaction.receiptUrl && (
                  <div className="md:col-span-2">
                    <label className={cn(theme.typography.labelSmall, "text-gray-500 mb-2 block")}>
                      Receipt
                    </label>
                    <a
                      href={transaction.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700"
                    >
                      <Icons.Paperclip className="h-5 w-5" />
                      <span className={theme.typography.body}>View Receipt</span>
                      <Icons.ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
              
              {/* Metadata */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-500">
                  <Icons.Clock className="h-4 w-4" />
                  <span className={theme.typography.bodyTiny}>
                    Created on {formattedTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <Link
              to={`/transactions/${transaction.id}/edit`}
              className={cn(theme.components.button.primary, "flex-1")}
            >
              <Icons.Edit2 className="h-4 w-4 mr-2 inline" />
              Edit Transaction
            </Link>
            <Link
              to="/transactions"
              className={theme.components.button.secondary}
            >
              Back to List
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useLoaderData, useActionData } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { theme, cn } from '~/lib/theme';
import * as Icons from 'lucide-react';

/**
 * LOADER: Fetch all categories for the user
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      _count: {
        select: {
          transactions: true,
          budgets: true,
        },
      },
    },
  });
  
  return { categories };
}

/**
 * ACTION: Delete a category
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get('intent');
  const categoryId = formData.get('categoryId');
  
  if (intent === 'delete' && typeof categoryId === 'string') {
    // Check if category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
      include: {
        _count: {
          select: { transactions: true, budgets: true },
        },
      },
    });
    
    if (!category) {
      return { error: 'Category not found' };
    }
    
    // Prevent deleting category with transactions
    if (category._count.transactions > 0 || category._count.budgets > 0) {
      return { 
        error: 'Cannot delete category with existing transactions or budgets' 
      };
    }
    
    await prisma.category.delete({
      where: { id: categoryId },
    });
    
    return { success: 'Category deleted successfully' };
  }
  
  return { error: 'Invalid action' };
}

/**
 * COMPONENT: Categories List Page
 */
export default function CategoriesPage() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  // Helper to get icon component
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
              to="/categories/new"
              className={theme.components.button.primary}
            >
              + New Category
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, theme.layout.section)}>
        <div className="mb-6">
          <h1 className={theme.typography.h1}>Categories</h1>
          <p className={theme.typography.bodySmall}>
            Organize your expenses into categories for better tracking
          </p>
        </div>
        
        {/* Success/Error Messages */}
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
        
        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className={cn(theme.components.card.base, "text-center py-12")}>
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
              />
            </svg>
            <h3 className={cn(theme.typography.h3, "mt-4")}>No categories yet</h3>
            <p className={cn(theme.typography.bodySmall, "mt-2")}>
              Get started by creating your first category
            </p>
            <Link
              to="/categories/new"
              className={cn(theme.components.button.primary, "mt-6 inline-flex")}
            >
              Create Category
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const IconComponent = getIcon(category.icon || 'Tag');
              
              return (
                <div
                  key={category.id}
                  className={theme.components.card.hover}
                >
                  <div className={theme.layout.card}>
                    {/* Category Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <IconComponent
                            className="h-6 w-6"
                            style={{ color: category.color }}
                          />
                        </div>
                        <div>
                          <h3 className={theme.typography.h4}>{category.name}</h3>
                          <p className={theme.typography.bodyTiny}>
                            {category._count.transactions} transactions
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Category Stats */}
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{category._count.budgets}</span>
                        {' '}budgets
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/categories/${category.id}/edit`}
                        className={cn(
                          theme.components.button.secondary,
                          "flex-1 text-center"
                        )}
                      >
                        Edit
                      </Link>
                      
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="categoryId" value={category.id} />
                        <button
                          type="submit"
                          disabled={category._count.transactions > 0 || category._count.budgets > 0}
                          className={cn(
                            theme.components.button.danger,
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            if (!confirm('Are you sure you want to delete this category?')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Delete
                        </button>
                      </Form>
                    </div>
                    
                    {(category._count.transactions > 0 || category._count.budgets > 0) && (
                      <p className="mt-2 text-xs text-orange-600">
                        Cannot delete: Has active transactions or budgets
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
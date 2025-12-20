import { redirect, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useActionData, useNavigation } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '~/lib/constants';
import { theme, cn } from '~/lib/theme';
import * as Icons from 'lucide-react';
import { useState } from 'react';

/**
 * ACTION: Create new category
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const name = formData.get('name');
  const color = formData.get('color');
  const icon = formData.get('icon');
  
  // Validation
  if (typeof name !== 'string' || name.length < 2) {
    return { errors: { name: 'Name must be at least 2 characters' } };
  }
  
  if (typeof color !== 'string' || !color.match(/^#[0-9A-F]{6}$/i)) {
    return { errors: { color: 'Invalid color format' } };
  }
  
  if (typeof icon !== 'string' || !CATEGORY_ICONS.includes(icon as any)) {
    return { errors: { icon: 'Invalid icon' } };
  }
  
  // Check for duplicate name
  const existing = await prisma.category.findFirst({
    where: {
      userId,
      name: {
        equals: name,
        mode: 'insensitive', // Case-insensitive
      },
    },
  });
  
  if (existing) {
    return { errors: { name: 'A category with this name already exists' } };
  }
  
  // Create category
  await prisma.category.create({
    data: {
      name,
      color,
      icon,
      userId,
    },
  });
  
  return redirect('/categories');
}

/**
 * COMPONENT: New Category Form
 */
export default function NewCategoryPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  
  // Selected color and icon state
  const [selectedColor, setSelectedColor] = useState<string>(CATEGORY_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState<string>(CATEGORY_ICONS[0]);
  
  // Get icon component
  const getIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Tag;
    const Icon = Icons[iconName as keyof typeof Icons] as any;
    return Icon || Icons.Tag;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className={theme.layout.container}>
          <div className="flex h-16 items-center">
            <Link to="/categories" className={cn(theme.typography.h4, "text-brand-600")}>
              ← Back to Categories
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={cn(theme.layout.container, "py-8")}>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h1 className={theme.typography.h1}>Create New Category</h1>
            <p className={theme.typography.bodySmall}>
              Add a new category to organize your expenses
            </p>
          </div>
          
          {/* Preview Card */}
          <div className={cn(theme.components.card.base, "mb-6")}>
            <div className={theme.layout.card}>
              <p className={cn(theme.typography.bodySmall, "mb-3")}>Preview:</p>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${selectedColor}20` }}
                >
                  {(() => {
                    const IconComponent = getIcon(selectedIcon);
                    return (
                      <IconComponent
                        className="h-8 w-8"
                        style={{ color: selectedColor }}
                      />
                    );
                  })()}
                </div>
                <div>
                  <p className={theme.typography.h3}>Category Name</p>
                  <p className={theme.typography.bodyTiny}>0 transactions</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form */}
          <Form method="post" className={theme.components.card.base}>
            <div className={cn(theme.layout.card, "space-y-6")}>
              {/* Category Name */}
              <div>
                <label htmlFor="name" className={theme.typography.label}>
                  Category Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g., Groceries"
                  className={theme.components.input.base}
                />
                {actionData?.errors?.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.name}
                  </p>
                )}
              </div>
              
              {/* Color Picker */}
              <div>
                <label className={theme.typography.label}>
                  Color *
                </label>
                <input type="hidden" name="color" value={selectedColor} />
                <div className="mt-2 grid grid-cols-8 gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={cn(
                        "h-10 w-10 rounded-lg border-2 transition-all",
                        selectedColor === color.value
                          ? "border-gray-900 scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              {/* Icon Picker */}
              <div>
                <label className={theme.typography.label}>
                  Icon *
                </label>
                <input type="hidden" name="icon" value={selectedIcon} />
                <div className="mt-2 grid grid-cols-8 gap-2">
                  {CATEGORY_ICONS.map((iconName) => {
                    const IconComponent = getIcon(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all",
                          selectedIcon === iconName
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
                        )}
                        title={iconName}
                      >
                        <IconComponent className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(theme.components.button.primary, "flex-1")}
                >
                  {isSubmitting ? 'Creating...' : 'Create Category'}
                </button>
                <Link
                  to="/categories"
                  className={cn(theme.components.button.secondary)}
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
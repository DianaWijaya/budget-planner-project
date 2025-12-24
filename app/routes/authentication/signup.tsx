// app/routes/register.tsx

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { createUserSession, getUserId } from "~/lib/session.server";
import { createUser, getUserByEmail } from "~/lib/auth.server";

/**
 * ENHANCED REGISTRATION WITH:
 * - Password confirmation
 * - Strong password validation
 * - Google OAuth placeholder (needs setup)
 * - Better UX
 */

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  return {};
}

/**
 * Password strength checker
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least one number");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("At least one special character (!@#$%^&*)");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  // Validate email
  if (typeof email !== "string" || email.length < 3 || !email.includes("@")) {
    return { 
      errors: { 
        email: "Please enter a valid email address", 
        password: null,
        confirmPassword: null 
      } 
    };
  }

  // Validate password exists
  if (typeof password !== "string") {
    return { 
      errors: { 
        email: null, 
        password: "Password is required",
        confirmPassword: null 
      } 
    };
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { 
      errors: { 
        email: null, 
        password: passwordValidation.errors.join(", "),
        confirmPassword: null 
      } 
    };
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    return { 
      errors: { 
        email: null, 
        password: null,
        confirmPassword: "Passwords do not match" 
      } 
    };
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { 
      errors: { 
        email: "An account with this email already exists", 
        password: null,
        confirmPassword: null 
      } 
    };
  }

  // Create user
  const user = await createUser({ email, password });
  
  // Create session and redirect
  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo: "/dashboard",
  });
}

export default function SignUp() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Start managing your budget today
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          {/* Google Sign Up - Placeholder (needs OAuth setup) */}
          <button
            type="button"
            onClick={() => alert("Google OAuth integration coming soon! For now, please use email signup.")}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-4 text-gray-500">Or continue with email</span>
            </div>
          </div>
        </div>

        {/* Email/Password Form */}
        <Form method="post" className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
                              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="you@example.com"
            />
            {actionData?.errors?.email && (
              <p className="mt-2 text-sm text-red-600">{actionData.errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Create a strong password"
            />
            {actionData?.errors?.password && (
              <p className="mt-2 text-sm text-red-600">{actionData.errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Type your password again"
            />
            {actionData?.errors?.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{actionData.errors.confirmPassword}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="rounded-lg bg-brand-50 p-4">
            <p className="text-xs font-medium text-brand-900">Password must contain:</p>
            <ul className="mt-2 space-y-1 text-xs text-brand-700">
              <li className="flex items-center gap-2">
                <span className="text-brand-500">•</span>
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500">•</span>
                One uppercase letter (A-Z)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500">•</span>
                One lowercase letter (a-z)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500">•</span>
                One number (0-9)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500">•</span>
                One special character (!@#$%^&*)
              </li>
            </ul>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
              I agree to the{" "}
              <Link to="/terms" className="text-brand-600 hover:text-brand-500 underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-brand-600 hover:text-brand-500 underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </Form>

        {/* Sign In Link */}
        <div className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * TO IMPLEMENT GOOGLE OAUTH:
 * 
 * You'll need to:
 * 1. Set up Google OAuth in Google Cloud Console
 * 2. Install a library like `@react-oauth/google` or `passport-google-oauth20`
 * 3. Create OAuth callback routes
 * 4. Store OAuth provider info in User model
 * 
 * Example schema addition:
 * 
 * model User {
 *   // ... existing fields
 *   googleId    String?  @unique
 *   provider    String?  // "email" | "google"
 * }
 */
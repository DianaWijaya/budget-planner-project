import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { createUserSession, getUserId } from "~/lib/session.server";
import { createUser, getUserByEmail } from "~/lib/auth.server";
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  return {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
  };
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
  const intent = formData.get('intent');

  // Handle Google OAuth
  if (intent === 'google') {
    const credential = formData.get('credential');
    
    if (typeof credential !== 'string') {
      return { 
        errors: { 
          email: 'Invalid Google credential',
          password: null,
          confirmPassword: null 
        } 
      };
    }

    try {
      // Decode the JWT token from Google
      const decoded: any = jwtDecode(credential);
      const { email, name, picture } = decoded;

      // Import prisma
      const { prisma } = await import('~/lib/prisma.server');
      
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // User already exists, just log them in
        return createUserSession({
          request,
          userId: user.id,
          remember: true,
          redirectTo: '/dashboard',
        });
      }

      // Create new user for Google OAuth
      user = await prisma.user.create({
        data: {
          email,
          password: '', // No password for OAuth users
        },
      });

      // Create session
      return createUserSession({
        request,
        userId: user.id,
        remember: true,
        redirectTo: '/dashboard',
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { 
        errors: { 
          email: 'Failed to sign up with Google',
          password: null,
          confirmPassword: null 
        } 
      };
    }
  }

  // Handle email/password signup
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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const formData = new FormData();
    formData.append('intent', 'google');
    formData.append('credential', credentialResponse.credential || '');

    // Submit the form programmatically
    const form = document.getElementById('google-oauth-form') as HTMLFormElement;
    if (form) {
      // Store credential in hidden input
      const credentialInput = document.createElement('input');
      credentialInput.type = 'hidden';
      credentialInput.name = 'credential';
      credentialInput.value = credentialResponse.credential || '';
      form.appendChild(credentialInput);
      form.submit();
    }
  };

  const handleGoogleError = () => {
    console.error('Google Sign Up failed');
  };

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
          {/* Google Sign Up - Functional with OAuth */}
          <div className="flex justify-center">
            <Form id="google-oauth-form" method="post" className="flex justify-center">
              <input type="hidden" name="intent" value="google" />
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  size="large"
                  width="384"
                  text="signup_with"
                  shape="rectangular"
                />
              </div>
            </Form>
          </div>

          {/* Error message for Google OAuth */}
          {actionData?.errors?.email && !actionData?.errors?.password && (
            <p className="text-sm text-red-600 text-center">{actionData.errors.email}</p>
          )}

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
          <input type="hidden" name="intent" value="email" />
          
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
            {actionData?.errors?.email && actionData?.errors?.password !== undefined && (
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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

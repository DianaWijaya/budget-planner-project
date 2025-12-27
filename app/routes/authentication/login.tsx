import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { Form, Link, useActionData, useSearchParams, useNavigation } from 'react-router';
import { verifyLogin } from '~/lib/auth.server';
import { createUserSession, getUserId } from '~/lib/session.server';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/dashboard');
  return {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
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
          password: null 
        } 
      };
    }

    try {
      // Decode the JWT token from Google
      const decoded: any = jwtDecode(credential);
      const { email, name, picture } = decoded;

      // Check if user exists or create new user
      const { prisma } = await import('~/lib/prisma.server');
      
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create new user for Google OAuth
        user = await prisma.user.create({
          data: {
            email,
            password: '', // No password for OAuth users
          },
        });
      }

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
          email: 'Failed to sign in with Google',
          password: null 
        } 
      };
    }
  }

  // Handle email/password login
  const email = formData.get('email');
  const password = formData.get('password');
  const redirectTo = formData.get('redirectTo') || '/dashboard';
  const remember = formData.get('remember');
  
  // Validate email
  if (typeof email !== 'string' || email.length < 3 || !email.includes('@')) {
    return { 
      errors: { 
        email: 'Please enter a valid email address',
        password: null 
      } 
    };
  }
  
  // Validate password
  if (typeof password !== 'string' || password.length === 0) {
    return { 
      errors: { 
        email: null,
        password: 'Password is required' 
      } 
    };
  }
  
  // Verify credentials
  const user = await verifyLogin(email, password);
  
  if (!user) {
    return { 
      errors: { 
        email: 'Invalid email or password',
        password: null 
      } 
    };
  }
  
  // Create session and redirect
  return createUserSession({
    request,
    userId: user.id,
    remember: remember === 'on',
    redirectTo: typeof redirectTo === 'string' ? redirectTo : '/dashboard',
  });
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  
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
    console.error('Google Sign In failed');
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          {/* Google Sign In - Now functional! */}
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
                  text="continue_with"
                  shape="rectangular"
                />
              </div>
            </Form>
          </div>

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
          <input type="hidden" name="redirectTo" value={redirectTo} />
          
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-brand-600 hover:text-brand-500"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Enter your password"
            />
            {actionData?.errors?.password && (
              <p className="mt-2 text-sm text-red-600">{actionData.errors.password}</p>
            )}
          </div>
          
          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
              Remember me for 7 days
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
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </Form>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-500">
            Create account
          </Link>
        </div>

        {/* Security Notice */}
        <div className="rounded-lg bg-gray-100 p-4">
          <div className="flex gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Secure Login</p>
              <p className="mt-1 text-xs text-gray-600">
                Your connection is encrypted and your data is protected with industry-standard security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
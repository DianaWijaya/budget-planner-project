import { createCookieSessionStorage, redirect } from 'react-router';
import { getUserById } from './auth.server';


// Check if SESSION_SECRET exists in environment variables
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in .env file');
}

/**
 * Create the session storage
 * This is like a secure box for storing session data in cookies
 */
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',  // Name of the cookie in browser
    httpOnly: true,     // Cookie can't be accessed by JavaScript (security!)
    path: '/',          // Cookie works on all pages
    sameSite: 'lax',    // Protects against CSRF attacks
    secrets: [process.env.SESSION_SECRET as string],  // Encrypts the cookie
    secure: process.env.NODE_ENV === 'production',    // HTTPS only in production
  },
});

const USER_SESSION_KEY = 'userId';

type LoaderFunctionArgs = {
  request: Request;
};

/**
 * FUNCTION 1: Get the session from a request
 * 
 * Every HTTP request might have a session cookie attached
 * This function reads and decrypts that cookie
 * 
 * @param request - The HTTP request object
 * @returns Session object (can read/write data to it)
 */
export async function getSession(request: Request) {
  // Get the 'Cookie' header from the request
  const cookie = request.headers.get('Cookie');
  
  // Decrypt and parse the session cookie
  return sessionStorage.getSession(cookie);
}

/**
 * FUNCTION 2: Get the logged-in user's ID
 * 
 * @param request - The HTTP request
 * @returns User ID if logged in, undefined if not logged in
 */
export async function getUserId(request: Request): Promise<string | undefined> {
  // Get the session
  const session = await getSession(request);
  
  // Read the userId from the session
  const userId = session.get(USER_SESSION_KEY);
  
  // Return userId (or undefined if not found)
  return userId;
}

/**
 * FUNCTION 3: Get the full user object
 * 
 * @param request - The HTTP request
 * @returns Full user object or null if not logged in
 * 
 * This is useful when you need more than just the ID
 * For example: displaying the user's email in the navbar
 */
export async function getUser(request: Request) {

  // Get user ID from session
  const userId = await getUserId(request);
  
  // If no userId, user is not logged in
  if (!userId) {
    return null;
  }
  
  // Fetch full user data from database
  const user = await getUserById(userId);
  
  // If user was deleted from database, return null
  if (!user) {
    throw await logout(request);
  }
  
  return user;
}

/**
 * FUNCTION 4: Require user to be logged in
 * 
 * Use this in routes that need authentication
 * If user is not logged in, redirect them to login page
 * 
 * @param request - The HTTP request
 * @param redirectTo - Where to redirect after login (optional)
 * @returns User object (guaranteed to exist)
 * 
 * Example: On dashboard page, you MUST be logged in
 */
export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {

  // Get user ID from session
  const userId = await getUserId(request);
  
  // If no userId, redirect to login
  if (!userId) {
    // Build login URL with redirect parameter
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  
  return userId;
}

/**
 * FUNCTION 5: Create a new login session
 * 
 * Call this after user successfully logs in
 * 
 * @param userId - The user's ID
 * @param redirectTo - Where to send user after login
 * @returns Response with Set-Cookie header
 */
export async function createUserSession({
  request,
  userId,
  remember,
  redirectTo,
}: {
  request: Request;
  userId: string;
  remember: boolean;
  redirectTo: string;
}) {

  // Get existing session (or create new one)
  const session = await getSession(request);
  
  // Store userId in the session
  session.set(USER_SESSION_KEY, userId);
  
  // Commit the session and get the cookie string
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session, {
        maxAge: remember
          ? 60 * 60 * 24 * 7
          : undefined,
      }),
    },
  });
}

/**
 * FUNCTION 6: Logout
 * 
 * Destroys the session and redirects to home page
 * 
 * @param request - The HTTP request
 * @returns Response that clears the cookie and redirects
 */
export async function logout(request: Request) {

  // Get the session
  const session = await getSession(request);
  
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}

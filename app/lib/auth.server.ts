import bcrypt from 'bcryptjs';
import { prisma } from './prisma.server';

interface CreateUserData {
  email: string;
  password: string;
}

/**
 * FUNCTION 1: Hash a password
 * 
 * @param password - Plain text password from user
 * @returns Hashed password (safe to store in database)
 * 
 * Example:
 * Input:  "myPassword123"
 * Output: "$2a$10$rZ7X8h9..." (60 character random string)
 */
export async function hashPassword(password: string): Promise<string> {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
}

/**
 * FUNCTION 2: Verify a password
 * 
 * @param password - Plain text password user just typed
 * @param hashedPassword - Hashed password from database
 * @returns true if passwords match, false otherwise
 * 
 * Example:
 * User types: "myPassword123"
 * Database has: "$2a$10$rZ7X8h9..."
 * bcrypt checks if they match → returns true
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const isValid = await bcrypt.compare(password, hashedPassword);
  return isValid;
}

/**
 * FUNCTION 3: Create a new user
 * 
 * @param userData - Object with email and password
 * @returns The created user object (without password!)
 * 
 * Steps:
 * 1. Hash the password
 * 2. Store user in database with hashed password
 * 3. Return user info (but remove password from response)
 */
export async function createUser({ email, password }: CreateUserData) {
  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });
  
  return user;
}

/**
 * FUNCTION 4: Login - verify email and password
 * 
 * @param email - User's email
 * @param password - Plain text password
 * @returns User object if credentials are valid, null otherwise
 * 
 * Steps:
 * 1. Find user by email
 * 2. If user doesn't exist, return null
 * 3. Verify password matches
 * 4. If password wrong, return null
 * 5. If all good, return user
 */
export async function verifyLogin(
  email: string,
  password: string
): Promise<{ id: string; email: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
    },
  });
  
  if (!user) {
    return null;
  }
  
  const isPasswordValid = await verifyPassword(password, user.password);
  
  if (!isPasswordValid) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
  };
}

/**
 * FUNCTION 5: Get user by ID
 * 
 * @param userId - The user's unique ID
 * @returns User object or null if not found
 * 
 * Used for:
 * - Loading user info after they log in
 * - Checking if a session is still valid
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });
  
  return user;
}
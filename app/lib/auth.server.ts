import bcrypt from 'bcryptjs';
import { prisma } from './prisma.server';

interface CreateUserData {
  email: string;
  password: string;
}

interface UserResult {
  id: string;
  email: string;
  createdAt: Date;
}

/**
 * Custom error types for better error handling
 */
export class UserExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserExistsError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const SALT_ROUNDS = 10;
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Create a new user
 * Note: Categories are now preset and handled on the frontend,
 * no need to seed them in the database
 */
export async function createUser({ 
  email, 
  password 
}: CreateUserData): Promise<UserResult> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new UserExistsError(email);
  }

  const hashedPassword = await hashPassword(password);
  
  // Create user
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
 * Verify user login credentials
 */
export async function verifyLogin(
  email: string,
  password: string
): Promise<UserResult | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      createdAt: true,
    },
  });
  
  if (!user) {
    // Still run bcrypt to prevent timing attacks
    await bcrypt.compare(password, '$2a$10$invalid.hash.to.prevent.timing.attack');
    return null;
  }
  
  const isPasswordValid = await verifyPassword(password, user.password);
  
  if (!isPasswordValid) {
    return null;
  }
  
  // Return user without password
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(
  userId: string
): Promise<UserResult | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  email: string
): Promise<Pick<UserResult, 'id' | 'email'> | null> {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
    },
  });
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

/**
 * Delete user account
 */
export async function deleteUser(userId: string): Promise<void> {
  await prisma.user.delete({
    where: { id: userId },
  });
}
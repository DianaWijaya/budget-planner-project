import { type ActionFunctionArgs } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { prisma } from '~/lib/prisma.server';
import { getChatbotResponse } from '~/lib/chatbot.server';

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const message = formData.get('message');
  
  if (typeof message !== 'string' || !message.trim()) {
    return { error: 'Message is required' };
  }
  
  try {
    // Fetch user's financial data for context
    const userData = await getUserFinancialContext(userId);
    
    // Get response from Gemini
    const response = await getChatbotResponse(message, userData);
    
    return { response };
  } catch (error) {
    console.error('Chat error:', error);
    return { error: 'Failed to get response. Please try again.' };
  }
}

async function getUserFinancialContext(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Get current month's data
  const [transactions, incomes, budget] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      orderBy: { date: 'desc' }
    }),
    prisma.income.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    }),
    prisma.budget.findFirst({
      where: {
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    })
  ]);
  
  return { transactions, incomes, budget };
}
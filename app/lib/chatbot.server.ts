import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getChatbotResponse(
  userMessage: string,
  financialData: any
) {
  const { transactions, incomes, budget } = financialData;
  
  // Calculate totals
  const totalSpent = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalIncome = incomes.reduce((sum: number, i: any) => sum + i.amount, 0);
  const budgetAmount = budget?.amount || 0;
  const remaining = budgetAmount - totalSpent;
  
  // Group transactions by category
  const categoryBreakdown = transactions.reduce((acc: any, t: any) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  
  // Create context for Gemini
  const context = `You are a helpful financial assistant for a budget tracking app.
The user is asking about their current month's finances. Here's their data:

📊 Financial Overview:
- Monthly Budget: $${budgetAmount.toFixed(2)}
- Total Income: $${totalIncome.toFixed(2)}
- Total Spent: $${totalSpent.toFixed(2)}
- Remaining Budget: $${remaining.toFixed(2)}
- Budget Status: ${remaining >= 0 ? '✅ Within budget' : '⚠️ Over budget'}

💰 Spending by Category:
${Object.entries(categoryBreakdown)
  .sort(([, a]: any, [, b]: any) => b - a)
  .map(([cat, amt]: any) => `- ${cat}: $${amt.toFixed(2)}`)
  .join('\n')}

📈 Quick Stats:
- Number of transactions: ${transactions.length}
- Average transaction: $${transactions.length > 0 ? (totalSpent / transactions.length).toFixed(2) : '0.00'}
- Largest expense category: ${Object.entries(categoryBreakdown).sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'None'}

Provide helpful, concise, and encouraging financial advice. Use emojis to make it friendly. Keep responses under 150 words unless the user asks for detailed analysis.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: context }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand your financial situation. How can I help you today?' }],
        },
      ],
    });
    
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return "Sorry, I'm having trouble connecting right now. Please try again in a moment!";
  }
}
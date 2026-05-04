
interface EmailParams {
  userId: string;
  email: string;
  amount: number;
  currency: string;
  method: string;
  transactionId?: string;
}

export async function sendWithdrawalEmail(params: EmailParams) {
  // Mock email sending service
  console.log(`Sending withdrawal confirmation to ${params.email} for ${params.amount} ${params.currency}`);
  return { success: true };
}

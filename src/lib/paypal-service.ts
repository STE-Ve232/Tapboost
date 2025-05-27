// lib/paypal-service.ts
import axios from 'axios';

interface InitiatePayPalPayoutParams {
  userId: string;
  recipientEmail: string;
  amount: number;
  currency: string;
  ipAddress?: string;
  note?: string;
}

interface InitiatePayPalPayoutResult {
  success: boolean;
  message: string;
  payoutId?: string;
  status?: string;
  fee?: number;
  errorDetails?: any;
}

interface PayPalAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalPayoutResponse {
  batch_header: {
    payout_batch_id: string;
    batch_status: string;
    sender_batch_header: {
      sender_batch_id: string;
      email_subject: string;
    };
    amount: {
      value: string;
      currency: string;
    };
    fees: {
      value: string;
      currency: string;
    };
  };
}

// Cache PayPal access token to avoid getting a new one for each request
let paypalAccessToken: string | null = null;
let tokenExpiration: number = 0;

export async function initiatePayPalPayout(
  params: InitiatePayPalPayoutParams
): Promise<InitiatePayPalPayoutResult> {
  const { userId, recipientEmail, amount, currency, ipAddress, note } = params;

  try {
    // Validate inputs
    if (amount <= 0) {
      return {
        success: false,
        message: 'Amount must be greater than zero',
        errorDetails: { code: 'INVALID_AMOUNT' }
      };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return {
        success: false,
        message: 'Invalid recipient email',
        errorDetails: { code: 'INVALID_EMAIL' }
      };
    }

    // Get PayPal access token
    const authToken = await getPayPalAccessToken();
    if (!authToken) {
      return {
        success: false,
        message: 'Failed to authenticate with PayPal',
        errorDetails: { code: 'AUTH_FAILED' }
      };
    }

    // Prepare payout request
    const payoutData = {
      sender_batch_header: {
        sender_batch_id: `payout_${Date.now()}_${userId}`,
        email_subject: "You have a payment",
        email_message: note || "Thank you for your business",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: amount.toFixed(2),
            currency,
          },
          note: note || "Withdrawal from your account",
          receiver: recipientEmail,
          sender_item_id: `item_${Date.now()}`,
        },
      ],
    };

    // Determine PayPal API URL based on environment
    const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'live' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';

    // Make API call to PayPal
    const response = await axios.post<PayPalPayoutResponse>(
      `${baseUrl}/v1/payments/payouts`,
      payoutData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'PayPal-Partner-Attribution-Id': 'YOUR_APP_NAME',
        },
      }
    );

    const payout = response.data.batch_header;

    return {
      success: true,
      message: 'Payout initiated successfully',
      payoutId: payout.payout_batch_id,
      status: payout.batch_status,
      fee: parseFloat(payout.fees.value),
    };

  } catch (error) {
    console.error('PayPal payout error:', error);

    let errorDetails = {};
    let errorMessage = 'Failed to initiate PayPal payout';

    if (axios.isAxiosError(error)) {
      errorDetails = {
        code: error.response?.data?.name || 'PAYPAL_API_ERROR',
        description: error.response?.data?.message || error.message,
        details: error.response?.data?.details,
      };
      errorMessage = error.response?.data?.message || errorMessage;
    } else if (error instanceof Error) {
      errorDetails = {
        code: 'INTERNAL_ERROR',
        description: error.message,
      };
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage,
      errorDetails,
    };
  }
}

async function getPayPalAccessToken(): Promise<string | null> {
  // Return cached token if it's still valid
  if (paypalAccessToken && Date.now() < tokenExpiration - 30000) {
    return paypalAccessToken;
  }

  try {
    const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'live' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';

    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString('base64');

    const response = await axios.post<PayPalAuthResponse>(
      `${baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    paypalAccessToken = response.data.access_token;
    tokenExpiration = Date.now() + response.data.expires_in * 1000;

    return paypalAccessToken;
  } catch (error) {
    console.error('Failed to get PayPal access token:', error);
    return null;
  }
}
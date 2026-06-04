import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const PESAPAL_BASE_URL = process.env.PESAPAL_ENVIRONMENT === 'live' 
  ? 'https://pay.pesapal.com/v3' 
  : 'https://cybqa.pesapal.com/pesapalv3';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getPesaPalToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await axios.post(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    });

    if (response.data.token) {
      cachedToken = response.data.token;
      // PesaPal token is valid for 30 minutes, we'll cache it for 25 to be safe.
      tokenExpiry = Date.now() + 25 * 60 * 1000; 
      return cachedToken;
    }
    return null;
  } catch (error) {
    console.error('PesaPal Auth Error:', error);
    return null;
  }
}

export async function submitOrder(orderData: any) {
  const token = await getPesaPalToken();
  if (!token) throw new Error('Could not authenticate with PesaPal');
  
  try {
    const response = await axios.post(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('PesaPal Order Error:', error);
    // It's better to throw the error so the calling function can handle it
    throw new Error('Failed to submit order to PesaPal.');
  }
}

export async function sendPesaPalPayout(amount: number, recipient: any, payoutType: 'bank' | 'card') {
  const token = await getPesaPalToken();
  if (!token) {
    return { success: false, message: 'Could not authenticate with payment provider.' };
  }

  const transactionId = uuidv4();
  const callbackUrl = process.env.NEXT_PUBLIC_APP_URL + '/api/pesapal/payout-ipn';

  // This structure is based on a interpretation of a typical disbursement API.
  // It may need to be adjusted based on official PesaPal documentation.
  const payload = {
    id: transactionId,
    amount,
    currency: "KES", // Assuming KES, this could be made dynamic.
    callback_url: callbackUrl,
    remittance: {
      recipient: {
        ...recipient, // Contains names and either bank or card details
        // The backend route already validates the presence of required fields.
      },
      payment_method: payoutType === 'bank' ? 'BANK' : 'CARD'
    }
  };

  try {
    console.log("Submitting Payout to PesaPal:", payload);
    // NOTE: The endpoint /api/Transactions/SubmitDisbursementRequest is an assumption.
    // Please verify with PesaPal's official API documentation for payouts.
    const response = await axios.post(`${PESAPAL_BASE_URL}/api/Transactions/SubmitDisbursementRequest`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data && (response.data.status === 'COMPLETED' || response.data.status === 'PENDING')) {
      return { success: true, transactionId: response.data.tracking_id || transactionId };
    } else {
      return { success: false, message: response.data.error?.message || 'Payout was not accepted by PesaPal.' };
    }
  } catch (error: any) {
    console.error('PesaPal Payout Submission Error:', error.response ? error.response.data : error.message);
    return { 
      success: false, 
      message: error.response?.data?.error?.message || 'An unexpected error occurred during payout submission.' 
    };
  }
}


export async function getTransactionStatus(orderTrackingId: string) {
  const token = await getPesaPalToken();
  if (!token) throw new Error('Could not authenticate with PesaPal');

  try {
    const response = await axios.get(`${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('PesaPal Status Error:', error);
    throw new Error('Failed to get transaction status from PesaPal.');
  }
}

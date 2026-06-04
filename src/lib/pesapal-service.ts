import axios from 'axios';

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
      tokenExpiry = Date.now() + 25 * 60 * 1000; // Token valid for 30 mins, refresh at 25
      return cachedToken;
    }
  } catch (error) {
    console.error('PesaPal Auth Error:', error);
    return null;
  }
}

export async function registerIPN(url: string) {
  const token = await getPesaPalToken();
  try {
    const response = await axios.post(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
      url,
      ipn_notification_type: 'GET'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.ipn_id;
  } catch (error) {
    console.error('PesaPal IPN Error:', error);
    return null;
  }
}

export async function submitOrder(orderData: any) {
  const token = await getPesaPalToken();
  try {
    const response = await axios.post(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('PesaPal Order Error:', error);
    return null;
  }
}

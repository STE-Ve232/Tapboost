
# TapBoost - MiniPay Tap to Earn

A high-performance "Tap to Earn" Mini App built for the MiniPay wallet on the Celo network. Earn real rewards by tapping, with automated payouts directly to your wallet.

## 🔗 PesaPal Integration Details

To receive automatic upgrades after a purchase, you **must** configure your PesaPal Merchant Dashboard with the following:

1.  **Website Domain:** `https://tapboost.vercel.app/`
2.  **IPN Listener Url:** `https://tapboost.vercel.app/api/pesapal/ipn`

## 🚀 How to Fix "403 Permission Denied" or "Authentication Failed"

If you get a `403` error even after using your token, it means the token was created without the correct permissions.

### 1. Fix your Token Permissions
1. Go to your [GitHub Token Settings](https://github.com/settings/tokens).
2. Find the token you created or generate a **New token (classic)**.
3. **CRITICAL:** You must check the box that says **'repo'** (Full control of private repositories).
4. Scroll to the bottom and click **Generate token**.
5. Copy the new token.

### 2. Update your remote URL (The Fix)
Run this command in your terminal. **Replace `YOUR_NEW_TOKEN` with the code you copied.** 

```bash
git remote set-url origin https://YOUR_NEW_TOKEN@github.com/STE-Ve232/Tapboost.git
```

### 3. Clear existing credentials (If 403 persists)
If it still says "Permission Denied", your computer might be trying to use an old saved password. Force it to use the token by running:

```bash
git push https://YOUR_NEW_TOKEN@github.com/STE-Ve232/Tapboost.git main
```

## 🛠 Deployment to Vercel

This app is optimized for Vercel. Follow these steps to go live:

1. **Connect to Vercel:**
   - Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
   - Import your GitHub repository `Tapboost`.

2. **Configure Environment Variables:**
   In the Vercel project settings, add:

   **Firebase:**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

   **Blockchain & Payouts:**
   - `TREASURY_PRIVATE_KEY`: Your 0x... private key.
   - `PESAPAL_CONSUMER_KEY`: Your PesaPal Key.
   - `PESAPAL_CONSUMER_SECRET`: Your PesaPal Secret.
   - `PESAPAL_ENVIRONMENT`: `sandbox` or `live`.

3. **Deploy:** Click **Deploy**.

## 📱 Features

- **PWA Support:** Installable on home screen with "Standalone" mode.
- **Persistent Earnings:** Balance and Tap Level ($0.30 - $1.10) saved in Firestore.
- **Real-time Currency:** Live conversion for KES, UGX, TZS, and RWF.
- **Celo Payouts:** Instant USDT/USDC/cUSD withdrawals for MiniPay users.
- **PesaPal Ready:** Direct purchase for tap power boosts.


# TapBoost - MiniPay Tap to Earn

A high-performance "Tap to Earn" Mini App built for the MiniPay wallet on the Celo network. Earn real rewards by tapping, with automated payouts directly to your wallet.

## 🚀 How to Push Changes to GitHub

GitHub requires a **Personal Access Token (PAT)** instead of your password. 

### 1. Generate a GitHub Token
1. Go to [GitHub Token Settings](https://github.com/settings/tokens).
2. Click **Generate new token (classic)**.
3. Give it a name (e.g., "TapBoost-Dev").
4. Select the **'repo'** checkbox scope.
5. Click **Generate token** and **COPY IT** immediately.

### 2. Update your local project
Run this command in your terminal (replace `<YOUR_TOKEN>` with the token you just copied):

```bash
git remote set-url origin https://<YOUR_TOKEN>@github.com/STE-Ve232/Tapboost.git
```

### 3. Push your commits
Now run the push command:

```bash
git push origin main
```

## 🛠 Deployment to Vercel

This app is optimized for Vercel. Follow these steps to go live:

1. **First Time Setup (if needed):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/STE-Ve232/Tapboost.git
   git push -u -f origin main
   ```

2. **Connect to Vercel:**
   - Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
   - Import your GitHub repository `Tapboost`.

3. **Configure Environment Variables:**
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

4. **Deploy:** Click **Deploy**.

## 📱 Features

- **PWA Support:** Installable on home screen with "Standalone" mode.
- **Persistent Earnings:** Balance and Tap Level ($0.30 - $1.10) saved in Firestore.
- **Celo Payouts:** Instant USDT/USDC/cUSD withdrawals for MiniPay users.
- **PesaPal Ready:** Infrastructure ready for deposit integration.

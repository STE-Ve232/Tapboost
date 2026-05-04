
# TapBoost - MiniPay Tap to Earn

A high-performance "Tap to Earn" Mini App built for the MiniPay wallet on the Celo network. Earn real rewards by tapping, with automated payouts directly to your wallet.

## 🚀 Deployment to Vercel

This app is optimized for Vercel. Follow these steps to go live:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/STE-Ve232/Tapboost.git
   # If remote already exists but is wrong:
   # git remote set-url origin https://github.com/STE-Ve232/Tapboost.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
   - Import your GitHub repository `Tapboost`.

3. **Configure Environment Variables:**
   In the Vercel project settings, add the following variables:

   **Firebase (Public):**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase Web API Key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: e.g., `your-project.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Project ID
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `your-project.appspot.com`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: From Firebase settings
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: From Firebase settings

   **Blockchain (Secret):**
   - `TREASURY_PRIVATE_KEY`: The 0x... private key of the wallet that will send rewards. **(Keep this secret!)**

4. **Deploy:** Click **Deploy**. Vercel will build the app and provide a URL.

## 📱 Adding to MiniPay

Once deployed:
1. Copy your Vercel URL (e.g., `https://tapboost.vercel.app`).
2. Open the **MiniPay Developer Console**.
3. Create a new Mini App and paste your URL.
4. Test it directly inside your MiniPay wallet!

## 🛠 Features

- **Auto-Wallet Connect:** Seamlessly connects to MiniPay on load.
- **Real-time Firestore DB:** All taps and earnings are saved permanently.
- **Celo Blockchain Payouts:** Real-time stablecoin transfers (USDT/USDC/cUSD).
- **PWA Support:** Installable and optimized for mobile performance.

## 🛡 Security Note

The `TREASURY_PRIVATE_KEY` is handled exclusively on the server side (`src/app/api/withdraw/crypto/route.ts`). Never expose this key in files starting with `NEXT_PUBLIC_`.

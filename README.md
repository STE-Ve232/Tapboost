# TapBoost - Tap to Earn

This is a Next.js "Tap to Earn" Progressive Web Application (PWA) where users can earn points by tapping, referring friends, and claiming daily bonuses. The application features a leaderboard and a mock withdrawal system.

## Features

- **Tap to Earn:** Users earn points for each tap.
- **Referral System:** Users earn bonus points for referring new users (mocked).
- **Daily Bonus:** Users can claim a daily bonus.
- **Withdrawal System:** Users can request to withdraw their earnings to a PayPal account (mocked, requires minimum earnings).
- **Leaderboard:** Displays top earners.
- **PWA Ready:** Includes a manifest.json and a service worker for offline capabilities and installability.
- **Responsive Design:** Adapts to different screen sizes.
- **ShadCN UI Components:** Utilizes modern and accessible UI components.
- **Next.js 15 App Router:** Built with the latest Next.js features for optimal performance.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
    cd YOUR_REPOSITORY_NAME
    ```
    (Replace `YOUR_USERNAME` and `YOUR_REPOSITORY_NAME` with your actual GitHub username and repository name)

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

### Running the Development Server

Once the dependencies are installed, you can start the development server:

Using npm:
```bash
npm run dev
```
Or using yarn:
```bash
yarn dev
```

This will start the development server, usually on `http://localhost:9002`. Open this URL in your browser to see the application.

## Building for Production

To create a production build of the application:

Using npm:
```bash
npm run build
```
Or using yarn:
```bash
yarn build
```

This command generates an optimized version of your application in the `.next` folder.

## Exporting as a Static Site (for GitHub Pages)

If you intend to deploy to a static hosting provider like GitHub Pages:

1.  **Configure `next.config.js`:**
    Ensure `output: 'export'` is set in your `next.config.js`.
    If deploying to a repository named `your-username.github.io/<reponame>`, you'll need to set `basePath` and `assetPrefix` in `next.config.js`. See the comments in that file for details.

    The `next.config.js` has been updated to automatically handle `basePath` and `assetPrefix` when `GITHUB_ACTIONS` environment variable is true and `repoName` is correctly set.
    **Important:** Make sure to replace `'YOUR_REPOSITORY_NAME'` in `next.config.js` with your actual repository name if it's not a user/org page (e.g., `your-username.github.io`).

2.  **Run the build and export commands:**
    Using npm:
    ```bash
    npm run build
    npm run export
    ```
    Or using yarn:
    ```bash
    yarn build
    yarn export
    ```
    This will generate the static files in the `out` directory.

## Deployment to GitHub Pages

This project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automates the build and deployment process to GitHub Pages when changes are pushed to the `main` branch.

**Manual Deployment Steps (if not using GitHub Actions or for understanding):**

1.  Ensure your `next.config.js` is correctly configured for `basePath` and `assetPrefix` if your repository is not `username.github.io`.
2.  Build and export the application: `npm run build && npm run export`.
3.  Create a `.nojekyll` file in the `out` directory: `touch ./out/.nojekyll`.
4.  Push the contents of the `out` directory to the `gh-pages` branch of your repository.
5.  Configure GitHub Pages in your repository settings to deploy from the `gh-pages` branch and the `/ (root)` folder.

## Technologies Used

-   [Next.js](https://nextjs.org/) - React framework for production
-   [React](https://reactjs.org/) - JavaScript library for building user interfaces
-   [TypeScript](https://www.typescriptlang.org/) - Superset of JavaScript for static typing
-   [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
-   [ShadCN UI](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS
-   [Lucide React](https://lucide.dev/) - Icon library
-   [Framer Motion](https://www.framer.com/motion/) - Animation library
-   [Genkit (Firebase Genkit)](https://firebase.google.com/docs/genkit) - For AI-powered features (if any are added)
-   [GitHub Actions](https://github.com/features/actions) - For CI/CD and automated deployment

## Project Structure

-   `src/app/`: Contains the main application routes and layout (App Router).
-   `src/components/`: Reusable UI components.
    -   `src/components/ui/`: ShadCN UI components.
-   `src/context/`: React Context providers.
-   `src/hooks/`: Custom React hooks.
-   `src/lib/`: Utility functions.
-   `src/ai/`: Genkit related AI flows and configurations (if used).
-   `public/`: Static assets, including `manifest.json` and `service-worker.js`.
-   `next.config.js`: Next.js configuration file.
-   `tailwind.config.ts`: Tailwind CSS configuration.
-   `tsconfig.json`: TypeScript configuration.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details (if one exists).
If no `LICENSE.md` file is present, the project is unlicensed and all rights are reserved.

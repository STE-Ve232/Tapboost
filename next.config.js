
import type {NextConfig} from 'next';

// Determine if the app is running on GitHub Actions
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

// IMPORTANT: Replace 'YOUR_REPOSITORY_NAME' with the actual name of your GitHub repository.
// For example, if your repository URL is https://github.com/your-username/my-awesome-app,
// then repoName should be 'my-awesome-app'.
// If your repository is named '<your-username>.github.io', you can leave this as 'YOUR_REPOSITORY_NAME' or an empty string.
const repoName = 'YOUR_REPOSITORY_NAME'; // FIXME: REPLACE THIS

let assetPrefix = undefined;
let basePath = undefined;

if (isGithubActions && repoName && repoName !== 'YOUR_REPOSITORY_NAME') {
  assetPrefix = `/${repoName}/`;
  basePath = `/${repoName}`;
} else if (isGithubActions && (repoName === 'YOUR_REPOSITORY_NAME' || !repoName) && !process.env.GITHUB_REPOSITORY?.endsWith('.github.io')) {
  // This console.warn will appear in your GitHub Actions logs
  console.warn(
    `Warning: 'YOUR_REPOSITORY_NAME' in next.config.js might need to be replaced with your actual repository name for GitHub Pages deployment if this is not a user/org page repository (e.g., your-username.github.io). If deploying to <username>.github.io/<reponame>, ensure repoName is set.`
  );
}


const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: assetPrefix,
  basePath: basePath,
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Required for 'output: export' with next/image, especially with basePath
  },
};

export default nextConfig;

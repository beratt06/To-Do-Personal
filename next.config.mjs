/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  typedRoutes: true,
  basePath: isGithubActions ? '/To-Do-Personal' : '',
};

export default nextConfig;

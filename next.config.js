/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Mark server-only packages as external for client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'ollama': 'ollama',
      });
    }

    return config;
  },
};

module.exports = nextConfig;
